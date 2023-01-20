/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Nov 2019     Doug Humberd     Send Statement email to the Multiple Invoice Emails (Customer Record) List using the template parameter given on the workflow action
 * 1.05       12 Nov 2019     Doug Humberd     Updated to also send emails to non-primary subsidiaries
 *
 */

/**
 * Constants
 */


/**
 * Populates the Free FOrm Address field on the WF Send Email action
 * 
 * @returns {Void} Any or no return value
 */
function is_cus_stmnt_email_wfAction() {
	try{
		
		// Initialize Values
		var custId = nlapiGetRecordId();
		var stmntEmails = nlapiGetFieldValue('custentity_scg_mult_inv_emails');
		var recipient = null;
		
		nlapiLogExecution('DEBUG', 'Initialize Values', 'Customer Id: ' + custId);
		nlapiLogExecution('DEBUG', 'Statement Emails', stmntEmails);
		
		// Get Parameters
		var emailTemplate = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_template');
		var emailAuthor = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_author');
		//var replyToEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_reply_to');
		
		var today = new Date();
		var date = nlapiDateToString(today, 'date');
		nlapiLogExecution('DEBUG', 'date', date);
		
		var sdate = new Array();
		//sdate.startdate = '02/07/2008';
		sdate.statementdate = date;
		sdate.openonly = 'T';
		
		var pdfFile = nlapiPrintRecord('STATEMENT', custId, 'PDF', sdate);
		
		// Merge email
		var emailMerger = nlapiCreateEmailMerger(emailTemplate);
		//emailMerger.setTransaction(transId);
		emailMerger.setEntity('customer',custId);
		
		var mailRec = emailMerger.merge();
		var emailSubject = mailRec.getSubject();
		var emailBody = mailRec.getBody();
		
		nlapiLogExecution('DEBUG', 'Email Template', 'Template: '+ emailTemplate+ ' Subject: '+emailSubject);
		
		// If Invoice Email Address List is null then end script
		if (stmntEmails == null){
			return;
		}
		
		// Invoice Emails may have spaces or ; between emails, replace these with a comma
		stmntEmails = stmntEmails.replace(", ", ",");
		stmntEmails = stmntEmails.replace(" ", ",");
		stmntEmails = stmntEmails.replace(";", ",");
		
		recipient = stmntEmails.split(",");
		
		nlapiLogExecution('DEBUG', 'Recipient Set to Array', 'Array: '+ recipient + ' Recipient Array length: ' + recipient.length);
		
		
		// Send Email if there is a recipient
		if(recipient != null){
			
			var records = new Object();
			//records['transaction'] = transId;
			records['entity'] = custId;
			
			//nlapiSendEmail(ACCOUNTS_RECEIVABLE_EMPLOYEE, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false, REPLY_TO_EMAIL);
			nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false);
		
			nlapiLogExecution('DEBUG', 'Send Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
			
			
			//Check for Non-Primary Subsidiaries, and send additional emails if found
			var submachineCount = nlapiGetLineItemCount('submachine');
			nlapiLogExecution('DEBUG', 'submachineCount', submachineCount);
			
			for (var i = 1; submachineCount != 0 && i <= submachineCount; i++){
				
				var balance = nlapiGetLineItemValue('submachine', 'balance', i);
				var nonPrimSub = nlapiGetLineItemValue('submachine', 'subsidiary', i);
				var isPrimeSub = nlapiGetLineItemValue('submachine', 'isprimesub', i);
				
				if (balance > 0 && isPrimeSub == 'F'){
					nlapiLogExecution('DEBUG', 'Balance FOUND: ' + balance, 'Non-Primary Subsidiary: ' + nonPrimSub);
					
					var sProp = new Array();
					//sProp.startdate = '02/07/2008';
					sProp.statementdate = date;
					sProp.openonly = 'T';
					sProp.subsidiary = nonPrimSub;
					
					var pdfFile = nlapiPrintRecord('STATEMENT', custId, 'PDF', sProp);
					
					var subSearch = getSubsidiaryInfo(nonPrimSub);
					
					if (subSearch){
				    	
				    	var subId = subSearch[0].getValue('internalid');
				    	var subName = subSearch[0].getValue('namenohierarchy');	
				    	var subPhone = subSearch[0].getValue('custrecord_ar_phonenum');
				    	//var subEmail = subSearch[0].getValue('email');
				    	var subTwitter = subSearch[0].getValue('custrecord_twitter');
				    	var subLinkedin = subSearch[0].getValue('custrecord_linkedin');
				    	var subEmailLogo = subSearch[0].getValue('custrecord_email_logo');
				    	
				    	nlapiLogExecution('DEBUG', 'Subsidiary ID', subId);
				    	nlapiLogExecution('DEBUG', 'Subsidiary Name', subName);
				    	nlapiLogExecution('DEBUG', 'Subsidiary Phone', subPhone);
				    	//nlapiLogExecution('DEBUG', 'Subsidiary Email', subEmail);
				    	nlapiLogExecution('DEBUG', 'Subsidiary Twitter', subTwitter);
				    	nlapiLogExecution('DEBUG', 'Subsidiary LinkedIn', subLinkedin);
				    	nlapiLogExecution('DEBUG', 'Subsidiary Email Logo', subEmailLogo);
				    		
				    }
					
					var disclaimer = '<span style="font-size:8pt"><span style="font-family:Calibri"><i><span style="font-size:8.0pt"><span style="color:#999999">Disclaimer: This message contains confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this email. Please notify the sender immediately by email if you have received this email by mistake and delete this email from your system. Our company accepts no liability for the content of this email, or for the consequences of any actions taken on the basis of the information provided. Any views or opinions presented in this email are solely those of the author and do not necessarily represent those of the company. Finally, the recipient should check this email and any attachments for the presence of viruses. The company accepts no liability for any damage caused by any virus transmitted by this email.<br /><br />Hubble&reg; is a brand name of the insightsoftware.com Group. insightsoftware.com is a registered trademark of insightsoftware.com Limited. Hubble is a registered trademark of insightsoftware.com International Unlimited. Registered in England No. 2860790 at 4th Floor, International House, 7 High Street, Ealing, W5 5DB, United Kingdom, VAT Number: GB 766 8160 9 </span></span></i></span></span>';
					
					var emailSubject = 'Monthly Statement for ' + custName + ' from ' + subName;
					var emailBody = 'Hello,<br /><br />Your monthly statement is attached.<br /><br />Kind regards,<br /><br /><strong>Accounts Team</strong><br />accounting@insightsoftware.com<br />' + subPhone + '<br /><a href="' + subTwitter + '"><img src="https://5172601.app.netsuite.com/core/media/media.nl?id=680&c=5172601&h=b0e00efd28665b8080bb" width=10; height=14; /></a> <a href="' + subLinkedin + '"><img alt="LinkedIn" src="https://5172601.app.netsuite.com/core/media/media.nl?id=681&c=5172601&h=e000c0271a276838db85" width=17; height=17; /></a><br /><a href="https://www.insightsoftware.com/"><img src="' + subEmailLogo + '" style="float: left; height: 40px;" /></a><br /><br />' + disclaimer;
					
					nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false);
					
					nlapiLogExecution('DEBUG', 'Send Non-Primary Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
					
				}//End if (balance > 0 && isPrimeSub == 'F')
				
			}//End for i loop
			
			
		}
		
		
	} catch(e) {
		is_email_logError(e);
		throw e;
	}
	
}




function getSubsidiaryInfo(subsidiary){
	
	//Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('name', null, 'contains', subsidiary));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'equalto', subsidiary));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('namenohierarchy', null, null));
	columns.push(new nlobjSearchColumn('custrecord_ar_phonenum', null, null));
	//columns.push(new nlobjSearchColumn('email', null, null));
	columns.push(new nlobjSearchColumn('custrecord_twitter', null, null));
	columns.push(new nlobjSearchColumn('custrecord_linkedin', null, null));
	columns.push(new nlobjSearchColumn('custrecord_email_logo', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('subsidiary', null, filters, columns);
	  
	// Return
	return results;
	
}





/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_email_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}