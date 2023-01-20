/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 May 2021     Doug Humberd     Gets all files attached to a Purchase Order, and attaches to / sends the PO Rejected emails
 *
 */


/**
 * Constants
 */


/**
 * Gets all files attached to a PR, and attaches to / sends the Pending Approval Emails
 * 
 * @returns {String} Comma Seperated List of Employees Emailed
 */
function is_send_Rejected_Email(){
	
	try{

		//Initalize Variables
		var poRec = nlapiGetNewRecord();
		var nextApprover = poRec.getFieldValue('nextapprover');
		var requestor = poRec.getFieldValue('employee');
		var poTranId = poRec.getFieldValue('tranid');
		var poId = poRec.getId();
		
		nlapiLogExecution('DEBUG', 'Requestor: ' + requestor, 'Next Approver: ' + nextApprover);
		nlapiLogExecution('DEBUG', 'poId = ' + poId, 'poTranId = ' + poTranId);
		
		
		var wfSubmitter = nlapiGetContext().getSetting('SCRIPT', 'custscript_scg_wf_submitter_2');
		nlapiLogExecution('DEBUG', 'WF Submitter', wfSubmitter);
		
		
		var nxtAppNameFields = nlapiLookupField('employee', nextApprover, ['firstname', 'lastname', 'email']);
		var reqEmpFields = nlapiLookupField('employee', requestor, ['firstname', 'lastname', 'email']);
		var wfSubmtrFields = nlapiLookupField('employee', wfSubmitter, ['firstname', 'lastname', 'email']);
		
		var firstname = reqEmpFields['firstname'];
		var lastname = reqEmpFields['lastname'];
		var nxtappemail = reqEmpFields['email'];
		
		var fromfirst = nxtAppNameFields['firstname'];
		var fromlast = nxtAppNameFields['lastname'];
		var fromemail = nxtAppNameFields['email'];
		
		var wfsubfirst = wfSubmtrFields['firstname'];
		var wfsublast = wfSubmtrFields['lastname'];
		
		var cState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
		var rejReason = poRec.getFieldValue('custbody_scg_reject_reason_po');
		var currency = poRec.getFieldValue('currencyname');
		var poTotal = poRec.getFieldValue('total');

		
		var commaNum = numberWithCommas(poTotal);
		nlapiLogExecution('DEBUG', 'Number with Commas', commaNum);
		
		poTotal = commaNum;
		
		nlapiLogExecution('DEBUG', 'Currency: ' + currency, 'PO Total: ' + poTotal);
		
		
		
		//Compose and Send the Emails to the list
		var emailSubj = 'Purchase Order ' + poTranId + ' has been Rejected';
		var string = 'View Record';
		var po_url = nlapiResolveURL('RECORD', 'purchaseorder', poId);
		var hyperlink = string.link(po_url);
		var files = [];
		
		var poAttach = nlapiPrintRecord('TRANSACTION', poId, 'PDF', null);
		
		files.push(poAttach);
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
		
		
		//var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' requires your Approval.<br><br>Requestor: ' + fromfirst + ' ' + fromlast + '<br><br><p><a href="https://6731106-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=221&deploy=1&compid=6731106_SB1&h=5549077aea5b9e02aa86&action=approve&prid=' + prId + '&prrectype=purchaserequisition&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://6731106-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=221&deploy=1&compid=6731106_SB1&h=5549077aea5b9e02aa86&action=reject&prid=' + poId + '&prrectype=purchaserequisition&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail;
		var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> has been Rejected.<br><br>Reason for Rejection: ' + rejReason + '<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
		
		nlapiLogExecution('DEBUG', emailSubj, emailBody);
		
		//nlapiSendEmail(requestor, nextApprover, emailSubj, emailBody, null, null, records, files);
		nlapiSendEmail(nextApprover, requestor, emailSubj, emailBody, null, null, records, files);
		
		//Send email to Workflow Submitter, if different from Requestor
		if (wfSubmitter != requestor && !isEmpty(wfSubmitter)){
			emailBody = 'Hello ' + wfsubfirst + ' ' + wfsublast + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> has been Rejected.<br><br>Reason for Rejection: ' + rejReason + '<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
			nlapiSendEmail(nextApprover, wfSubmitter, emailSubj, emailBody, null, null, records, files);
		}
		
		//Return
		return nextApprover;
		
	} catch(e) {
		is_poAppvl_logError(e);
		return 0;
	}
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




function numberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

