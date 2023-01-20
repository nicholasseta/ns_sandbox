/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Jun 2021     Doug Humberd     Gets all files attached to a Purchase Order (marked to be sent to vendor), and attaches to / sends the vendor email
 * 1.05       23 Mar 2022     Doug Humberd     Updated to only attach the PDF to the email, and no longer include all other files
 * 1.06       22 Dec 2022     Doug Humberd     Updated to include Vendor Name in Email Subject
 *
 */


/**
 * Constants
 */
const FINANCE_PROCUREMENT = 6849517;//Employee: Finance Procurement
//const INSIGHT_LOGO = 'https://5172601-sb1.app.netsuite.com/core/media/media.nl?id=683&c=5172601_SB1&h=197942274a67c48e3510';//InsightSoftware Logo: File Cabinet: Images > Logos
const INSIGHT_LOGO = 'https://5172601.app.netsuite.com/core/media/media.nl?id=683&c=5172601&h=197942274a67c48e3510';//InsightSoftware Logo: File Cabinet: Images > Logos


/**
 * Gets all files attached to a PR, and attaches to / sends the Pending Approval Emails
 * 
 * @returns {String} Comma Seperated List of Employees Emailed
 */
function is_send_Vendor_Email(){
	
	try{

		//Initalize Variables
		var poRec = nlapiGetNewRecord();
		//var nextApprover = poRec.getFieldValue('nextapprover');
		var requestor = poRec.getFieldValue('employee');
		var poTranId = poRec.getFieldValue('tranid');
		var poId = poRec.getId();
		var vendId = poRec.getFieldValue('entity');
		var vendorName = poRec.getFieldText('entity');
		var subsidiary = poRec.getFieldValue('subsidiary');
		var subsidiaryName = poRec.getFieldText('subsidiary');
		var emailAddresses;
		
		//nlapiLogExecution('DEBUG', 'Requestor: ' + requestor, 'Next Approver: ' + nextApprover);
		nlapiLogExecution('DEBUG', 'Requestor', requestor);
		nlapiLogExecution('DEBUG', 'poId = ' + poId, 'poTranId = ' + poTranId);
		nlapiLogExecution('DEBUG', 'Vendor ID: ' + vendId, 'Vendor Name: ' + vendorName);
		nlapiLogExecution('DEBUG', 'Subsidiary: ' + subsidiary, 'Subsidiary Name: ' + subsidiaryName);
		
		
		//var wfSubmitter = nlapiGetContext().getSetting('SCRIPT', 'custscript_scg_wf_submitter');
		//nlapiLogExecution('DEBUG', 'WF Submitter', wfSubmitter);
		
		
		//var nxtAppNameFields = nlapiLookupField('employee', nextApprover, ['firstname', 'lastname', 'email']);
		//var reqEmpFields = nlapiLookupField('employee', requestor, ['firstname', 'lastname', 'email']);
		//var wfSubmtrFields = nlapiLookupField('employee', wfSubmitter, ['firstname', 'lastname', 'email']);
		var finProcEmpFields = nlapiLookupField('employee', FINANCE_PROCUREMENT, ['firstname', 'lastname', 'email']);
		
		var firstname = finProcEmpFields['firstname'];
		var lastname = finProcEmpFields['lastname'];
		var finprocemail = finProcEmpFields['email'];
		
		//var fromfirst = nxtAppNameFields['firstname'];
		//var fromlast = nxtAppNameFields['lastname'];
		//var fromemail = nxtAppNameFields['email'];
		
		//var wfsubfirst = wfSubmtrFields['firstname'];
		//var wfsublast = wfSubmtrFields['lastname'];
		
		//var cState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
		//var currency = poRec.getFieldValue('currencyname');
		//var poTotal = poRec.getFieldValue('total');

		
		//var commaNum = numberWithCommas(poTotal);
		//nlapiLogExecution('DEBUG', 'Number with Commas', commaNum);
		
		//poTotal = commaNum;
		
		//nlapiLogExecution('DEBUG', 'Currency: ' + currency, 'PO Total: ' + poTotal);
		
		
		//Get Email Address from Vendor (if exists) to Send To
		var vendRec = nlapiLoadRecord('vendor', vendId);
		
		var vendEmail = vendRec.getFieldValue('email');
		
		if (!isEmpty(vendEmail)){
			
			if (isEmpty(emailAddresses)){
				emailAddresses = vendEmail;
			}else{
				emailAddresses = emailAddresses + ',' + vendEmail;
			}
			
		}
		
		//Get All Email Addresses from Primary Contacts (if exists) to Send To
		var searchresults = getVendorContacts(vendId);
		
		if (searchresults){
			
			for (var i = 0; i < searchresults.length; i++){
				
				var contactId = searchresults[i].getValue('internalid');
				var contactRole = searchresults[i].getValue('contactrole');
				var contactEmail = searchresults[i].getValue('email');
				
				//alert ('Contact ID = ' + contactId + '\nContact Role = ' + contactRole + '\nContact Email = ' + contactEmail);
				
				if (contactRole == -10 && !isEmpty(contactEmail)){//-10 = Primary Contact
					
					if (isEmpty(emailAddresses)){
						emailAddresses = contactEmail;
					}else{
						emailAddresses = emailAddresses + ',' + contactEmail;
					}
					
				}
				
			}//End for i loop
			
		}//End if (searchresults)
		
		
		// Set recipient
		recipient = emailAddresses.split(',');
		nlapiLogExecution('DEBUG', 'Recipient Emails', recipient);
		
		
		//Compose and Send the Emails to the list
		//var emailSubj = 'Purchase Order ' + poTranId + ' from ' + subsidiaryName;
		//var emailSubj = 'insightsoftware Purchase Order Issued';
		var emailSubj = 'insightsoftware Purchase Order Issued - ' + vendorName;
		//var string = 'View Record';
		//var po_url = nlapiResolveURL('RECORD', 'purchaseorder', poId);
		//var hyperlink = string.link(po_url);
		//var logo = 'https://5172601-sb1.app.netsuite.com/core/media/media.nl?id=683&c=5172601_SB1&h=197942274a67c48e3510';
		
		var files = [];
		
		var poAttach = nlapiPrintRecord('TRANSACTION', poId, 'PDF', null);
		
		files.push(poAttach);
		nlapiLogExecution('DEBUG', 'Files - Only Transaction PDF', files);

		//Get Files to Attach, if any, and put into array
		//var attachFilesSearch = getFilesToAttach(poId);
		
		//if (attachFilesSearch){
			
			//for (var x = 0; x < attachFilesSearch.length; x++){
				
				//var attachFileId = attachFilesSearch[x].getValue('internalid', 'file');
				//nlapiLogExecution('DEBUG', 'Attach File', attachFileId);
				
				//if (!isEmpty(attachFileId)){
					//var fileToAttach = nlapiLoadFile(attachFileId);
					//files.push(fileToAttach);
				//}
				
			//}//End for x loop
			
		//}//End if (attachFilesSearch)
		
		//nlapiLogExecution('DEBUG', 'Total Files to Attach', files);
		
		
		var records = new Object();
		records['transaction'] = poId;
		
		
		//var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' requires your Approval.<br><br>Requestor: ' + fromfirst + ' ' + fromlast + '<br><br><p><a href="https://6731106-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=221&deploy=1&compid=6731106_SB1&h=5549077aea5b9e02aa86&action=approve&prid=' + prId + '&prrectype=purchaserequisition&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://6731106-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=221&deploy=1&compid=6731106_SB1&h=5549077aea5b9e02aa86&action=reject&prid=' + poId + '&prrectype=purchaserequisition&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail;
		//var emailBody = 'Hello ' + firstname + ' ' + lastname + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> has been Approved.<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
		//var emailBody = 'Dear ' + vendorName + ',<br><br>Attached please find the approved Purchase Order ' + poTranId + ' from ' + subsidiaryName + '.  Please confirm you have received this.<br>Please include this Purchase Order reference number on any invoice/invoices covered by the scope of this Purchase Order.<br><br>Let us know if you have any questions.<br><br>Thank you,<br><br>' + firstname + ' ' + lastname + '<br>1548 Eureka Road | Roseville, CA 95661<br>' + finprocemail + '<br><br><img border=0 src=' + INSIGHT_LOGO + ' width=10% height=10%>';
		var emailBody = 'Dear ' + vendorName + ',<br><br>Attached please find the approved Purchase Order ' + poTranId + ' from ' + subsidiaryName + '.  Please confirm you have received this.<br>Please include this Purchase Order reference number on any invoice/invoices covered by the scope of this Purchase Order.<br><br>Let us know if you have any questions.<br><br>Thank you,<br><br><span style="font-size:11pt"><span style="font-family:Calibri,sans-serif"><b><span style="font-size:14.0pt"><span style="color:#007bc3">Procurement Team&nbsp; &nbsp; &nbsp; &nbsp;</span></span></b>&nbsp;&nbsp;</span></span><br>' + finprocemail + '<br><br><img border=0 src=' + INSIGHT_LOGO + ' width=15% height=15%>';
		
		nlapiLogExecution('DEBUG', emailSubj, emailBody);
		
		//nlapiSendEmail(requestor, nextApprover, emailSubj, emailBody, null, null, records, files);
		//nlapiSendEmail(nextApprover, requestor, emailSubj, emailBody, null, null, records, files);
		nlapiSendEmail(FINANCE_PROCUREMENT, recipient, emailSubj, emailBody, requestor, null, records, files);
		
		//Send email to Workflow Submitter, if different from Requestor
		//if (wfSubmitter != requestor && !isEmpty(wfSubmitter)){
			//emailBody = 'Hello ' + wfsubfirst + ' ' + wfsublast + ',<br><br>Purchase Order ' + poTranId + ' for <b>' + currency + ' ' + poTotal + '</b> has been Approved.<br><br>Please contact me if you have any questions.<br><br>' + fromfirst + ' ' + fromlast + '<br>' + fromemail + '<br><br><b>' + hyperlink + '</b>';
			//nlapiSendEmail(nextApprover, wfSubmitter, emailSubj, emailBody, null, null, records, files);
		//}
		
		//Return
		//return nextApprover;
		
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
	filters.push(new nlobjSearchFilter('description', 'file', 'contains', 'SEND_TO_VENDOR'));
	  
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





function getVendorContacts(vendId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('company', null, 'anyof', vendId));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('contactrole', null, null));
	columns.push(new nlobjSearchColumn('email', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('contact', null, filters, columns);
	  
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

