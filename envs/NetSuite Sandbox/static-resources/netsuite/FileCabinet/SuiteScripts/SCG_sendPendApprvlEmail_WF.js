/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 May 2021     Doug Humberd     Gets all files attached to a Purchase Order, and attaches to / sends the Approval Required emails
 * 1.05       16 Mar 2022     Doug Humberd     Updated for scenarios where the Next Approver is the dummy employee 'Inactive Approver'
 * 1.10       10 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 * 1.15       20 Jul 2022     Doug Humberd     Updated to send differently worded email when Procurement Team being notified in lieu of the Supervisor (during supervisor hierarchy)
 *
 */


/**
 * Constants
 */
const INACTIVE_APPROVER = 13207923;//Employee: Inactive Approver
const PROCUREMENT_TEAM = 12297611;//Employee: Procurement Team


/**
 * Gets all files attached to a PR, and attaches to / sends the Pending Approval Emails
 * 
 * @returns {String} Comma Seperated List of Employees Emailed
 */
function is_send_PendApprvl_Email(){
	
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
		var fromfirst = reqEmpFields['firstname'];
		var fromlast = reqEmpFields['lastname'];
		var fromemail = reqEmpFields['email'];
		
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
		//case '9'://Finance - Procurement 2
			//cStateText = 'Final Finance';
			//break;
		default:
			break;
		}
		
		
		var currency = poRec.getFieldValue('currencyname');
		var poTotal = poRec.getFieldValue('total');
		//poTotal = poTotal.toLocaleString();
		//poTotal = Number(parseFloat(poTotal).toFixed(2)).toLocaleString('en', {
		    //minimumFractionDigits: 2
		//});
		//poTotal = Number(parseFloat(poTotal).toFixed(2)).toLocaleString('en');
		
		var commaNum = numberWithCommas(poTotal);
		nlapiLogExecution('DEBUG', 'Number with Commas', commaNum);
		
		poTotal = commaNum;
		
		nlapiLogExecution('DEBUG', 'Currency: ' + currency, 'PO Total: ' + poTotal);
		
		
		
		//Compose and Send the Emails to the list
		//var emailSubj = 'Purchase Order ' + poTranId + ' Requires Approval';
		if (inactiveApprover == 'N'){
			if (cState == '2' && nextApprover == PROCUREMENT_TEAM){
				var emailSubj = 'Purchase Order ' + poTranId + ' Requires ' + cStateText + ' Approval (Current Approver is the CEO, and the PO Total < $250,000)';
			}else{
				var emailSubj = 'Purchase Order ' + poTranId + ' Requires Approval';
			}
		}else{
			var emailSubj = 'Purchase Order ' + poTranId + ' Requires ' + cStateText + ' Approval (Current Approver is INACTIVE)';
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
		
		
		//var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> requires your Approval.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601_SB1&h=9ec59b3e7c8506b28639&action=approve&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601_SB1&h=9ec59b3e7c8506b28639&action=reject&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
		if (inactiveApprover == 'N'){
			if (cState == '2' && nextApprover == PROCUREMENT_TEAM){
				var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> requires ' + cStateText + ' Approval, but the current configured approver is the CEO, and the total is < $250,000.<br>This Purchase Order has been redirected to Purchasing for assistance.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
			}else{
				var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> requires your Approval.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br><p><a href="https://5172601.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601&h=b3c9438d69dcf70a7e46&action=approve&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601&h=b3c9438d69dcf70a7e46&action=reject&poid=' + poId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
			}
		}else{
			var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> requires ' + cStateText + ' Approval, but the current configured approver is INACTIVE.<br>This Purchase Order has been redirected to Purchasing for assistance.<br><br>Employee: ' + fromfirst + ' ' + fromlast + '<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
		}
		
		nlapiLogExecution('DEBUG', emailSubj, emailBody);
		
		nlapiSendEmail(requestor, nextApprover, emailSubj, emailBody, null, null, records, files);
		
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

