/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Mar 2021     Doug Humberd     Gets a list of Employees with a Finance Role and sends an approval email
 * 1.05       14 May 2021     Doug Humberd     Updated to include additional attachments
 * 1.10       24 May 2021     Doug Humberd     Updated to send email to purchasing@insightsoftware.com instead of users with finance procurement role
 * 1.15       23 Jun 2021     Doug Humberd     Updated to remove Approve/Reject links from email.  Approval to be done via UI only for this team
 *
 */


/**
 * Constants
 */
const FINANCE_ROLE = '1042';//User Role: IS Accounting Manager - Finance Procurement
const FINANCE_EMAIL = 'purchasing@insightsoftware.com';//Finance Procurement Email Address


/**
 * Gets a list of Employees with a Finance Role and sends an approval email
 * 
 * @returns {Integer} Purchase Approval Limit
 */
function is_poAppvl_emailFinanceProcurement(){
	
	try{

	//Initalize Variables
	var poRec = nlapiGetNewRecord();
	var poType = nlapiGetRecordType();
	//var group = poRec.getFieldValue('nextapprover');
	var employee = poRec.getFieldValue('employee');
	//var empNameFields = nlapiLookupField('employee', group, ['firstname', 'lastname']);
	//var firstname = empNameFields['firstname'];
	//var lastname = empNameFields['lastname'];
	var fromEmpFields = nlapiLookupField('employee', employee, ['firstname', 'lastname', 'email']);
	var fromfirst = fromEmpFields['firstname'];
	var fromlast = fromEmpFields['lastname'];
	var fromemail = fromEmpFields['email'];
	//var emp_text = poRec.getFieldText('employee');
	var nextApprover = poRec.getFieldValue('nextapprover');
	var cState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
	//var prevAppvr = poRec.getFieldValue('custworkflow_scg_po_appvl_prev_app');
	var po_tranid = poRec.getFieldValue('tranid');
	var poId = poRec.getId();
	//var vendor = poRec.getFieldText('entity');
	//var date = poRec.getFieldValue('trandate');
	//var total = poRec.getFieldValue('total');
	
	var emailList = '';
	var seperator = ',';
	
	//nlapiLogExecution('DEBUG', 'PO ID', poId);
	
	//Get Employee Information
	//var emplIds = asp_getEmployeeIds(group);
	
	/*
	
	var financeIds = is_getFinanceIds();
	
	for (var i = 0; i < financeIds.length; i++){
	   var searchresult = financeIds[i];
	   var email = searchresult.getValue('email');

	   if (emailList == ''){
			emailList = email;
		}
		else{
			emailList = emailList + seperator + email;
		}
	   
	}
	
	nlapiLogExecution('DEBUG', 'Email List', emailList);
	
	*/
	
	//emailList = 'doug.humberd@saascg.com';//TEMP CODE
	//nlapiLogExecution('DEBUG', 'Modified Email List', emailList);//TEMP CODE
	
	//Compose and Send the Emails to the list
	var files = [];
	var emailSubj = 'Purchase Order ' + po_tranid + ' Requires Approval';
	var string = 'View Record';
	var po_url = nlapiResolveURL('RECORD', poType, poId);
	var hyperlink = string.link(po_url);
	//var emailBody = 'Hello Accounting Manager,<br><br>This Journal Entry requires your approval.<br><br>Employee: ' + emp_text + '<br>Vendor: ' + vendor + '<br>Purchase Order #: ' + poId_tranid + '<br>Date: ' + date + '<br>Total: $' + total + '<br><br>If you have any questions, please reply to this email.<br><br>Thank you,<br><br>' + fromfirst + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
	//var emailBody = 'Hello Finance Procurement Team,<br><br>Purchase Order ' + po_tranid + ' requires your Approval and Verification.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=approve&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=reject&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
	var emailBody = 'Hello Procurement Team,<br><br>Purchase Order ' + po_tranid + ' requires your Approval and Verification.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
	
	var emailAttachment = nlapiPrintRecord('TRANSACTION', poId, 'PDF', null);
	
	files.push(emailAttachment);
	nlapiLogExecution('DEBUG', 'Files - Only Transaction PDF', files);
	
	
	//Get Files to Attach, if any, and put into array
	var attachFilesSearch = getFilesToAttach(poId);
	
	if (attachFilesSearch){
		
		for (var x = 0; x < attachFilesSearch.length; x++){
			
			var attachFileId = attachFilesSearch[x].getValue('internalid', 'file');
			nlapiLogExecution('DEBUG', 'Attach File', attachFileId);
			
			if (!isEmpty(attachFileId)){
				var fileToAttach = nlapiLoadFile(attachFileId);
				files.push(fileToAttach);
			}
			
		}//End for x loop
		
	}//End if (attachFilesSearch)
	
	nlapiLogExecution('DEBUG', 'Total Files to Attach', files);
	
	
	var records = new Object();
	records['transaction'] = poId;
	
	//nlapiSendEmail(employee, emailList, emailSubj, emailBody, null, null, records, files);
	nlapiSendEmail(employee, FINANCE_EMAIL, emailSubj, emailBody, null, null, records, files);
	
	//Return
	return emailList;
	
	} catch(e) {
		is_poAppvl_logError(e);
		return 0;
	}
}


/**
 * Returns a list of employee records to be processed
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_getFinanceIds(){
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('role', null, 'anyof', FINANCE_ROLE));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('email', null, null));

	return nlapiSearchRecord('employee', null, filters, columns);
}






function getFilesToAttach(poId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', poId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', 'file', null));
	  
	// Get results
	var results = nlapiSearchRecord('purchaseorder', null, filters, columns);
	  
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






/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_poAppvl_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}

