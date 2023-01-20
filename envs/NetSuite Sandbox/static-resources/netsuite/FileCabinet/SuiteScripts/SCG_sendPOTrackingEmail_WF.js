/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Mar 2022     Doug Humberd     Sends an email to the requestor when a PO moves to the next Approval State, so they can track PO status
 * 1.01       16 Mar 2022     Doug Humberd     Updated for scenarios where the Next Approver is the dummy employee 'Inactive Approver'
 * 1.05       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 * 1.10       22 Sep 2022     Doug Humberd     Updated to attach documents to tracking email
 *
 */


/**
 * Constants
 */
const INACTIVE_APPROVER = 13207923;//Employee: Inactive Approver
const PROCUREMENT_TEAM = 12297611;//Employee: Procurement Team


/**
 * Sends an email to the requestor when a PO moves to the next Approval State
 * 
 * @returns {String} Comma Seperated List of Employees Emailed
 */
function is_send_PO_Tracking_Email(){
	
	try{

		//Initalize Variables
		var poRec = nlapiGetNewRecord();
		var nextApprover = poRec.getFieldValue('nextapprover');
		var requestor = poRec.getFieldValue('employee');
		var poTranId = poRec.getFieldValue('tranid');
		var poId = poRec.getId();
		var inactiveApprover = 'N';
		
		nlapiLogExecution('DEBUG', 'Requestor: ' + requestor, 'Next Approver: ' + nextApprover);
		nlapiLogExecution('DEBUG', 'poId = ' + poId, 'poTranId = ' + poTranId);
		
		if (nextApprover == INACTIVE_APPROVER){
			nlapiLogExecution('DEBUG', 'Next Approver is Inactive Approver', 'Set Next Approver = Procurement Team');
			nextApprover = PROCUREMENT_TEAM;
			inactiveApprover = 'Y';
		}
		
		
		var nxtAppNameFields = nlapiLookupField('employee', nextApprover, ['firstname', 'lastname']);
		var firstname = nxtAppNameFields['firstname'];
		var lastname = nxtAppNameFields['lastname'];
		var reqEmpFields = nlapiLookupField('employee', requestor, ['firstname', 'lastname', 'email']);
		var reqfirst = reqEmpFields['firstname'];
		var reqlast = reqEmpFields['lastname'];
		var reqemail = reqEmpFields['email'];
		
		var cState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
		var cStateText;
		
		switch(cState){
		case '2'://Supervisor Approval
			cStateText = 'Supervisor';
			break;
		//case '3':// VP/SVP/GM Approval
			//cStateText = 'VP/SVP/GM';
			//break;
		//case '4'://ELT Member Approval
			//cStateText = 'ELT Member';
			//break;
		case '5'://Head of FP&A Approval
			cStateText = 'Head of FP&A';
			break;
		case '6'://CFO Approval
			cStateText = 'CFO';
			break;
		case '7'://CEO Approval
			cStateText = 'CEO';
			break;
		case '9'://Finance - Procurement 2
			cStateText = 'Final Finance';
			break;
		default:
			break;
		}
		
		
		//var currency = poRec.getFieldValue('currencyname');
		//var poTotal = poRec.getFieldValue('total');
		//poTotal = poTotal.toLocaleString();
		//poTotal = Number(parseFloat(poTotal).toFixed(2)).toLocaleString('en', {
		    //minimumFractionDigits: 2
		//});
		//poTotal = Number(parseFloat(poTotal).toFixed(2)).toLocaleString('en');
		
		//var commaNum = numberWithCommas(poTotal);
		//nlapiLogExecution('DEBUG', 'Number with Commas', commaNum);
		
		//poTotal = commaNum;
		
		//nlapiLogExecution('DEBUG', 'Currency: ' + currency, 'PO Total: ' + poTotal);
		
		
		
		//Compose and Send the Emails to the list
		//var emailSubj = 'Purchase Order ' + poTranId + ' is Pending ' + cStateText + ' Approval';
		if (inactiveApprover == 'N'){
			var emailSubj = 'Purchase Order ' + poTranId + ' is Pending ' + cStateText + ' Approval';
		}else{
			var emailSubj = 'Purchase Order ' + poTranId + ' is Pending ' + cStateText + ' Approval (Current Approver is INACTIVE)';
		}
		
		
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
		
		
		//var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> requires your Approval.<br><br>Employee: ' + reqfirst + ' ' + reqlast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=approve&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=reject&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + reqfirst + ' ' + reqlast + '<br>' + reqemail + '<br><br><b>' + hyperlink + '</b>';
		//var emailBody = 'Hello ' + reqfirst + ' ' + reqlast + ',<br><br>Purchase Order ' + poTranId + ' is now awaiting ' + cStateText + ' approval from ' + firstname + ' ' + lastname + '.<br><br>The Purchase Order can be accessed using the link below.<br><br><b>' + hyperlink + '</b>';
		if (inactiveApprover == 'N'){
			var emailBody = 'Hello ' + reqfirst + ' ' + reqlast + ',<br><br>Purchase Order ' + poTranId + ' is now awaiting ' + cStateText + ' approval from ' + firstname + ' ' + lastname + '.<br><br>The Purchase Order can be accessed using the link below.<br><br><b>' + hyperlink + '</b>';
		}else{
			var emailBody = 'Hello ' + reqfirst + ' ' + reqlast + ',<br><br>Purchase Order ' + poTranId + ' is now awaiting ' + cStateText + ' approval from ' + firstname + ' ' + lastname + '.<br>The current configured approver is INACTIVE, so this Purchase Order has been redirected to Purchasing for assistance.<br><br>The Purchase Order can be accessed using the link below.<br><br><b>' + hyperlink + '</b>';
		}
		
		nlapiLogExecution('DEBUG', emailSubj, emailBody);
		
		//nlapiSendEmail(requestor, nextApprover, emailSubj, emailBody, null, null, records, files);
		nlapiSendEmail(nextApprover, requestor, emailSubj, emailBody, null, null, records, files);
		
		//Return
		return nextApprover;
		
	} catch(e) {
		is_poTrack_logError(e);
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
function is_poTrack_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}

