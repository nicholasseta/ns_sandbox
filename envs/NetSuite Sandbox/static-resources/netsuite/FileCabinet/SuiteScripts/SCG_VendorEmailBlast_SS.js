/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Apr 2022     Doug Humberd     Scheduled Script to send bulk emails to vendors (email blast)
 * 1.05       05 Jul 2022     Doug Humberd     Updated to INCLUDE subsidiaries, not EXCLUDE
 *
 */


/**
 * Constants
 */
const EMAIL_ATTACH_FOLDER = '4073109';//Folder: Vendor Email Blast Attachments


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_sendVendEmailBlast_logError(e) {
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
function is_sendVendEmailBlast(type){
	
	nlapiLogExecution('DEBUG', 'sendVendEmailBlast', 'START');
	
	var vendId;
	var lastId;
	var minRecId = 0;
	var recipient;
	var files = [];
	
	var is_veb_context = nlapiGetContext();
	
	var startUsage = is_veb_context.getRemainingUsage();
	nlapiLogExecution('DEBUG', 'Start Usage', startUsage);
	
    var subIds = is_veb_context.getSetting('SCRIPT', 'custscript_veb_sub_ids');
    var templateId = is_veb_context.getSetting('SCRIPT', 'custscript_veb_template_id');
    var emailAuthor = is_veb_context.getSetting('SCRIPT', 'custscript_veb_emailauthor');
    var reprocess = is_veb_context.getSetting('SCRIPT', 'custscript_veb_reprocess');
    //var lastSaleFrom = is_veb_context.getSetting('SCRIPT', 'custscript_date_last_sale_from');
    //var lastSaleTo = is_veb_context.getSetting('SCRIPT', 'custscript_date_last_sale_to');
    //var lerEmailBlast = is_veb_context.getSetting('SCRIPT', 'custscript_ler_email_blast');
    //var inclDisabledEmailCusts = is_veb_context.getSetting('SCRIPT', 'custscript_incl_disabled_email_custs');
    
    nlapiLogExecution('DEBUG', 'Subsidiary Ids', subIds);
    nlapiLogExecution('DEBUG', 'Template Id', templateId);
    nlapiLogExecution('DEBUG', 'Email Author', emailAuthor);
    nlapiLogExecution('DEBUG', 'Reprocess', reprocess);
    //nlapiLogExecution('DEBUG', 'Last Sale Date From: ' + lastSaleFrom, 'Last Sale Date To: ' + lastSaleTo);
    //nlapiLogExecution('DEBUG', 'LER Email Blast', lerEmailBlast);
    //nlapiLogExecution('DEBUG', 'Include Disabled Invoice Email Customers', inclDisabledEmailCusts);
    
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
	//var custIds = is_veb_getcustIds(minRecId, subIds, reprocess, lastSaleFrom, lastSaleTo, lerEmailBlast, inclDisabledEmailCusts);
	var vendIds = is_veb_getvendIds(minRecId, subIds, reprocess);
	var count = 0;
	
	if (!vendIds){
		nlapiLogExecution('DEBUG', 'No Vendor Ids Found with Search Criteria', 'EXIT');
		return;
	}
	
	nlapiLogExecution('DEBUG', 'vendIds Length', vendIds.length);
	
	
	//Loop through vendor list and send emails
	while (vendIds && vendIds.length > 0){
		
		// Loop through the results and update them
		is_veb_scheduledBatch(vendIds, function (vendId) {
			try{
				
				vendorId = vendId.getValue('internalid');
				
				if (vendorId != lastId){
					
					lastId = vendorId;
					//nlapiLogExecution('DEBUG', 'vendId', vendorId);
					
					//Clear out previous errors, if they exist
					nlapiSubmitField('vendor', vendorId, ['custentity_scg_vend_email_blast_incmplte', 'custentity_scg_vend_email_blast_error'], ['F', '']);

					vendRec = nlapiLoadRecord('vendor', vendorId);
					
					var vendName = vendRec.getFieldValue('companyname');
					//var emailList = vendRec.getFieldValue('custentity_scg_mult_inv_emails');
					var emailList = vendRec.getFieldValue('email');
					
					nlapiLogExecution('DEBUG', 'Vendor: ' + vendName, 'Email List: ' + emailList);
					
					
					// Merge email
					var emailMerger = nlapiCreateEmailMerger(templateId);
					//emailMerger.setTransaction(transId);
					emailMerger.setEntity('vendor',vendorId);
					
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
						records['entity'] = vendorId;
						//if (vendorId == '398131'){//TEMP
						nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, files, true, false);
						
						nlapiLogExecution('DEBUG', 'Send Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
						//}//TEMP
					}
					
					
					count = count + 1;
					
				}//End if (vendorId != lastId)
				
				
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
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', vendorId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						nlapiLogExecution('DEBUG', 'Customer ID at Error', vendorId);
						nlapiSubmitField('customer', vendorId, ['custentity_scg_cust_email_blast_incmplte', 'custentity_scg_cust_email_blast_error'], ['T', errorMessage]);
						//nlapiSubmitField('customer', customerId, 'custentity_scg_cust_email_blast_incmplte', 'T');
						//nlapiSubmitField('customer', customerId, 'custentity_scg_cust_email_blast_error', errorMessage);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
					nlapiSubmitField('customer', vendorId, ['custentity_scg_cust_email_blast_incmplte', 'custentity_scg_cust_email_blast_error'], ['T', errorMessage]);
				}
			}
		});
		
		
		var endUsage = is_veb_context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'End Usage', endUsage);
		
		// Check for any additional records
		minRecId = vendorId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		vendIds = is_veb_getvendIds(minRecId, subIds, reprocess);
		
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
function is_veb_scheduledBatch(arr, proc) {

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
function is_veb_getvendIds(minRecId, subIds, reprocess) {
	
	nlapiLogExecution('DEBUG', 'Subsidiary Ids in Search', subIds);
	//nlapiLogExecution('DEBUG', 'Last Sale From in Search', lastSaleFrom);
	//nlapiLogExecution('DEBUG', 'Last Sale To in Search', lastSaleTo);
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	//filters.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subIds));
	if (!isEmpty(subIds)){
		//filters.push(new nlobjSearchFilter('subsidiary', null, 'noneof', subIds));
		filters.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subIds));
	}
	filters.push(new nlobjSearchFilter('email', null, 'isnotempty', ''));
	//if (inclDisabledEmailCusts != 'T'){
		//filters.push(new nlobjSearchFilter('custentity_disable_invoice_email_notice', null, 'is', 'F'));
	//}
	//filters.push(new nlobjSearchFilter('lastsaledate', null, 'within', [lastSaleFrom, lastSaleTo]));
	//if (!isEmpty(lastSaleFrom)){
		//filters.push(new nlobjSearchFilter('lastsaledate', null, 'onorafter', lastSaleFrom));
	//}
	//if (!isEmpty(lastSaleTo)){
		//filters.push(new nlobjSearchFilter('lastsaledate', null, 'onorbefore', lastSaleTo));
	//}
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	if (reprocess == 'T'){
		filters.push(new nlobjSearchFilter('custentity_scg_vend_email_blast_incmplte', null, 'is', 'T'));
	}
	//if (lerEmailBlast == 'T'){
		//filters.push(new nlobjSearchFilter('custentity_ler_email_blast', null, 'is', 'T'));
	//}
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92', '646001', '63888']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['55525']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	//columns.push(new nlobjSearchColumn('nextbilldate', null, null));
	//columns.push(new nlobjSearchColumn('trandate', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('vendor', null, filters, columns);
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




