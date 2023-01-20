/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Jul 2020     Doug Humberd     Scheduled Script to send bulk emails to customers (email blast)
 * 1.05       17 Sep 2020     Doug Humberd     Updated to check for'Reprocess Only Previously Failed Customers' checkbox, and filter customers accordingly
 * 1.10       16 Oct 2020     Doug Humberd     Updated to include 'Date of Last Sale' fields
 * 1.20       22 Jun 2021     Doug Humberd     Updated to include 'LER Email Blast' field, and to bypass Subsidiary / Last Sale Date field filters if empty
 * 1.25       20 Jan 2022     Doug Humberd     Updated to include 'Include Disabled Invoice Email Customers' field.  Update the search filter.
 *
 */


/**
 * Constants
 */
const EMAIL_ATTACH_FOLDER = '878617';//Customer Bulk Email Attachments Folder


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_sendBulkEmail_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function is_sendBulkEmail(type){
	
	nlapiLogExecution('DEBUG', 'sendBulkEmail', 'START');
	
	var custId;
	var lastId;
	var minRecId = 0;
	var recipient;
	var files = [];
	
	var is_sbe_context = nlapiGetContext();
	
	var startUsage = is_sbe_context.getRemainingUsage();
	nlapiLogExecution('DEBUG', 'Start Usage', startUsage);
	
    var subIds = is_sbe_context.getSetting('SCRIPT', 'custscript_subsidiary_ids');
    var templateId = is_sbe_context.getSetting('SCRIPT', 'custscript_template_id');
    var emailAuthor = is_sbe_context.getSetting('SCRIPT', 'custscript_send_email_author');
    var reprocess = is_sbe_context.getSetting('SCRIPT', 'custscript_reprocess');
    var lastSaleFrom = is_sbe_context.getSetting('SCRIPT', 'custscript_date_last_sale_from');
    var lastSaleTo = is_sbe_context.getSetting('SCRIPT', 'custscript_date_last_sale_to');
    var lerEmailBlast = is_sbe_context.getSetting('SCRIPT', 'custscript_ler_email_blast');
    var inclDisabledEmailCusts = is_sbe_context.getSetting('SCRIPT', 'custscript_incl_disabled_email_custs');
    
    nlapiLogExecution('DEBUG', 'Subsidiary Ids', subIds);
    nlapiLogExecution('DEBUG', 'Template Id', templateId);
    nlapiLogExecution('DEBUG', 'Email Author', emailAuthor);
    nlapiLogExecution('DEBUG', 'Reprocess', reprocess);
    nlapiLogExecution('DEBUG', 'Last Sale Date From: ' + lastSaleFrom, 'Last Sale Date To: ' + lastSaleTo);
    nlapiLogExecution('DEBUG', 'LER Email Blast', lerEmailBlast);
    nlapiLogExecution('DEBUG', 'Include Disabled Invoice Email Customers', inclDisabledEmailCusts);
    
    if (!isEmpty(subIds)){
	    subIds = subIds.split("");
	    nlapiLogExecution('DEBUG', 'subIds after Split', subIds);
	    
	    while (subIds.indexOf('[') != -1){
	    	subIds = subIds.replace('[', '');
		}
		while (subIds.indexOf(']') != -1){
			subIds = subIds.replace(']', '');
		}
		while (subIds.indexOf('"') != -1){
			subIds = subIds.replace('"', '');
		}
		
		nlapiLogExecution('DEBUG', 'Subsidiary Ids After Replace', subIds);
	
		nlapiLogExecution('DEBUG', 'Count of SubIds', subIds.length);
	}else{
		nlapiLogExecution('DEBUG', 'SubIds Empty', '0');
	}

	
	//Get Files to Attach, if any, and put into array
	var attachFilesSearch = getFilesToAttach(EMAIL_ATTACH_FOLDER);
	
	if (attachFilesSearch){
		
		for (var x = 0; x < attachFilesSearch.length; x++){
			
			var attachFileId = attachFilesSearch[x].getValue('internalid');
			nlapiLogExecution('DEBUG', 'Attach File', attachFileId);
			var fileToAttach = nlapiLoadFile(attachFileId);
			files.push(fileToAttach);
			
		}//End for i loop
		
	}//End if (attachFilesSearch)
	
	nlapiLogExecution('DEBUG', 'Files to Attach', files);
	
	
	//Get list of Customers that Emails will be sent to
	var custIds = is_sbe_getCustIds(minRecId, subIds, reprocess, lastSaleFrom, lastSaleTo, lerEmailBlast, inclDisabledEmailCusts);
	var count = 0;
	
	if (!custIds){
		nlapiLogExecution('DEBUG', 'No Customer Ids Found with Search Criteria', 'EXIT');
		return;
	}
	
	nlapiLogExecution('DEBUG', 'custIds Length', custIds.length);
	
	
	//Loop through customer list and send emails
	while (custIds && custIds.length > 0){
		
		// Loop through the results and update them
		is_sbe_scheduledBatch(custIds, function (custId) {
			try{
				
				customerId = custId.getValue('internalid');
				
				if (customerId != lastId){
					
					lastId = customerId;
					//nlapiLogExecution('DEBUG', 'custId', customerId);
					
					//Clear out previous errors, if they exist
					nlapiSubmitField('customer', customerId, ['custentity_scg_cust_email_blast_incmplte', 'custentity_scg_cust_email_blast_error'], ['F', '']);

					custRec = nlapiLoadRecord('customer', customerId);
					
					var custName = custRec.getFieldValue('companyname');
					var emailList = custRec.getFieldValue('custentity_scg_mult_inv_emails');
					
					nlapiLogExecution('DEBUG', 'Customer: ' + custName, 'Email List: ' + emailList);
					
					
					// Merge email
					var emailMerger = nlapiCreateEmailMerger(templateId);
					//emailMerger.setTransaction(transId);
					emailMerger.setEntity('customer',customerId);
					
					var mailRec = emailMerger.merge();
					var emailSubject = mailRec.getSubject();
					var emailBody = mailRec.getBody();
					
					nlapiLogExecution('DEBUG', 'Email Template', 'Template: ' + templateId + ' Subject: ' + emailSubject);
					
					// If Multiple Invoice Emails is null then end script
					if (emailList == null){
						return;
					}
					
					// Multiple Invoice Emails may have spaces or ; between emails, replace these with a comma
					emailList = emailList.replace(", ", ",");
					emailList = emailList.replace(" ", ",");
					emailList = emailList.replace(";", ",");
					
					recipient = emailList.split(",");
					
					nlapiLogExecution('DEBUG', 'Recipient Set to Array', 'Array: ' + recipient + ' Recipient Array length: ' + recipient.length);
					
					// Send Email if there is a recipient
					if(recipient != null){
						
						var records = new Object();
						//records['transaction'] = transId;
						records['entity'] = customerId;
						//if (customerId == '398131'){//TEMP
						nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, files, true, false);
						
						nlapiLogExecution('DEBUG', 'Send Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
						//}//TEMP
					}
					
					
					count = count + 1;
					
				}//End if (customerId != lastId)
				
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('debug','Usage Exceeded on script:', 'SCG_sentJoinedStmtsInvoices_SS');
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', customerId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						nlapiLogExecution('DEBUG', 'Customer ID at Error', customerId);
						nlapiSubmitField('customer', customerId, ['custentity_scg_cust_email_blast_incmplte', 'custentity_scg_cust_email_blast_error'], ['T', errorMessage]);
						//nlapiSubmitField('customer', customerId, 'custentity_scg_cust_email_blast_incmplte', 'T');
						//nlapiSubmitField('customer', customerId, 'custentity_scg_cust_email_blast_error', errorMessage);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
					nlapiSubmitField('customer', customerId, ['custentity_scg_cust_email_blast_incmplte', 'custentity_scg_cust_email_blast_error'], ['T', errorMessage]);
				}
			}
		});
		
		
		var endUsage = is_sbe_context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'End Usage', endUsage);
		
		// Check for any additional records
		minRecId = customerId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		custIds = is_sbe_getCustIds(minRecId, subIds, reprocess, lastSaleFrom, lastSaleTo, lerEmailBlast, inclDisabledEmailCusts);
		
	}//End while loop
	
	nlapiLogExecution('DEBUG', 'Count of Search Results', count);
	
	
}




/**
 * Processes each element of an array, checks remaining governance units 
 * and reschedules the script, if needed.
 * 
 * @appliedtorecord invoice
 * 
 * @param {Array} arr: array to be processed by the script
 * @param {Array} proc: function to be used to process each element of the array
 * @returns {Void}
 */
function is_sbe_scheduledBatch(arr, proc) {

	// Initialize variables
	var maxUsage = 0;
	var startUsage = nlapiGetContext().getRemainingUsage();
	
	// Loop through the array
	for (var i in arr){
		// Process the current array value
		proc(arr[i], i, arr);
		
		// Update the percent complete value on the script status page
		if (nlapiGetContext().getExecutionContext() == "scheduled") nlapiGetContext().setPercentComplete( ((100*i)/arr.length ).toFixed(1));
		
		// Track governance and reschedule script, if needed
		var endUsage = nlapiGetContext().getRemainingUsage();
		var runUsage = startUsage - endUsage;
		//nlapiLogExecution('debug', 'End Usage / Run Usage', endUsage + ' / ' + runUsage);
		if (maxUsage < runUsage) maxUsage = runUsage;
		if (endUsage < (maxUsage + 40)){
			var state = nlapiYieldScript();
			if (state.status == 'FAILURE') {
					nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
					throw "Failed to reschedule script";
			} else if ( state.status == 'RESUME' ) {
				nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
			}
			startUsage = nlapiGetContext().getRemainingUsage();
		} else {
			startUsage = endUsage;
		}
	}
}




/**
 * Returns a list of Sales Orders to be processed (to join statements / invoices, and email)
 * 
 * @appliedtorecord customer
 * 
 * @returns {nlobjSearch}
 */
function is_sbe_getCustIds(minRecId, subIds, reprocess, lastSaleFrom, lastSaleTo, lerEmailBlast, inclDisabledEmailCusts) {
	
	nlapiLogExecution('DEBUG', 'Subsidiary Ids in Search', subIds);
	nlapiLogExecution('DEBUG', 'Last Sale From in Search', lastSaleFrom);
	nlapiLogExecution('DEBUG', 'Last Sale To in Search', lastSaleTo);
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	//filters.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subIds));
	if (!isEmpty(subIds)){
		filters.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subIds));
	}
	filters.push(new nlobjSearchFilter('custentity_scg_mult_inv_emails', null, 'isnotempty', ''));
	if (inclDisabledEmailCusts != 'T'){
		filters.push(new nlobjSearchFilter('custentity_disable_invoice_email_notice', null, 'is', 'F'));
	}
	//filters.push(new nlobjSearchFilter('lastsaledate', null, 'within', [lastSaleFrom, lastSaleTo]));
	if (!isEmpty(lastSaleFrom)){
		filters.push(new nlobjSearchFilter('lastsaledate', null, 'onorafter', lastSaleFrom));
	}
	if (!isEmpty(lastSaleTo)){
		filters.push(new nlobjSearchFilter('lastsaledate', null, 'onorbefore', lastSaleTo));
	}
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	if (reprocess == 'T'){
		filters.push(new nlobjSearchFilter('custentity_scg_cust_email_blast_incmplte', null, 'is', 'T'));
	}
	if (lerEmailBlast == 'T'){
		filters.push(new nlobjSearchFilter('custentity_ler_email_blast', null, 'is', 'T'));
	}
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92', '646001', '63888']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	//columns.push(new nlobjSearchColumn('nextbilldate', null, null));
	//columns.push(new nlobjSearchColumn('trandate', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('customer', null, filters, columns);
}




function getFilesToAttach(EMAIL_ATTACH_FOLDER){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('folder', null, 'anyof', EMAIL_ATTACH_FOLDER));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('file', null, filters, columns);
	  
	// Return
	return results;
	
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}




