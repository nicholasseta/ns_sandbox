/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				21 Nov 2019		Doug Humberd		Joins and Sends Combined Statements / Open Overdue Invoices to Customers
 * 1.05             03 Mar 2020     Doug Humberd        Updated to remove "Jet" restrictions
 * 1.10             09 Mar 2020     Doug Humberd        Updated to only send Statement File if # of Invoices > 75
 * 1.15             12 Mar 2020     Doug Humberd        Updated to not attach invoice if Data Migration is checked, and Invoice < 90 days in NetSuite
 *
 */
 
 
 /**
 * Constants
 */
//const SUB_GROUP_JET_GLOBAL = '6';//Jet Global Subsidiary Group
const CUST_STMTS_INV_FOLDER = '568439'//Customer Statements and Invoices


 /**
 * Global Variables
 */
//var is_ijsi_context = nlapiGetContext();


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_ijsi_logError(e) {
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
function is_ijsi_sendIncmpltJoinedStmtsInvs(type) {
	
	nlapiLogExecution('DEBUG', 'is_ijsi_sendIncmpltJoinedStmtsInvs', 'START');
	
	// Initialize variables
	var minRecId = 0;
	
	var customerIds = is_ijsi_getCustomerIds(minRecId);
	var count = 0;
	var custId;
	var filesToDelete;
	
	while (customerIds && customerIds.length > 0){
		
		// Loop through the results and update them
		is_ijsi_scheduledBatch(customerIds, function (customerId) {
			try{
				// Initialize variables
				filesToDelete = [];
				custId = customerId.getValue('internalid');
				blnce = customerId.getValue('balance');
				nlapiLogExecution('DEBUG', 'Balance', blnce);
				var sendEmail = 'T';
				
				//Check Processing Incomplete Checkbox - to be unchecked after emails are sent
				//nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_incomplete', 'T');//Moved to 'flag' scheduled script
				
				custRec = nlapiLoadRecord('customer', custId);
				//var custName = customerId.getValue('altname');
				var custName = custRec.getFieldValue('entityid');
				while (custName.indexOf('.') != -1){
					custName = custName.replace(".", "");
				}
				while (custName.indexOf(',') != -1){
					custName = custName.replace(",", "");
				}
				//var primSubId = nlapiLookupField('customer', custId, 'subsidiary');
				var primSubId = custRec.getFieldValue('subsidiary');
				//var primSubsidiary = nlapiLookupField('customer', custId, 'subsidiarynohierarchy', true);
				var primSubsidiary = custRec.getFieldText('subsidiary');
				while (primSubsidiary.indexOf('.') != -1){
					primSubsidiary = primSubsidiary.replace(".", "");
				}
				while (primSubsidiary.indexOf(',') != -1){
					primSubsidiary = primSubsidiary.replace(",", "");
				}
				var stmntEmails = customerId.getValue('custentity_scg_mult_inv_emails');
				var recipient = null;
				
				nlapiLogExecution('DEBUG', 'Initialize Values', 'Customer Id: ' + custId);
				nlapiLogExecution('DEBUG', 'Subsidiary ID', primSubId);
				nlapiLogExecution('DEBUG', 'Customer Name: ' + custName, 'Primary Subsidiary: ' + primSubsidiary);
				nlapiLogExecution('DEBUG', 'Statement Emails', stmntEmails);
				
				// Get Parameters
				var emailTemplate = nlapiGetContext().getSetting('SCRIPT', 'custscript_ijsi_email_template');
				var emailAuthor = nlapiGetContext().getSetting('SCRIPT', 'custscript_ijsi_email_author');
				
				var today = new Date();
				var date = nlapiDateToString(today, 'date');
				nlapiLogExecution('DEBUG', 'date', date);
				
				var sdate = new Array();
				//sdate.startdate = '02/07/2008';
				sdate.statementdate = date;
				sdate.openonly = 'T';

				
				//START JET IF STATEMENT HERE
				
				//if (primSubsidiary.indexOf('Jet') == -1){//Do NOT Run for 'Jet' subsidiaries
					
					//Create the Statement PDF for the Primary Subsidiary
				if (blnce > 0){
					var pdfFile = nlapiPrintRecord('STATEMENT', custId, 'PDF', sdate);
				
					
					//Save the Statement PDF to the File Cabinet
					pdfFile.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices
					pdfFile.setName('Statement_' + custName + '_' + primSubsidiary + '.pdf');

					var pdfStmtFileId = nlapiSubmitFile(pdfFile);
					nlapiLogExecution('DEBUG', 'PDF Statement File Id', pdfStmtFileId);
					
					//Store File Id - to be deleted after email has been sent
					filesToDelete.push(pdfStmtFileId);
					
					//Load the saved statement PDF, and set Available without Logon to true
					var loadedStmtFile = nlapiLoadFile(pdfStmtFileId);
					loadedStmtFile.setIsOnline(true);
					
					//Re-save the Statement PDF to capture the Available without Login change, and then reload for processing 
					pdfStmtFileId = nlapiSubmitFile(loadedStmtFile);
					loadedStmtFile = nlapiLoadFile(pdfStmtFileId);
					
					//Get the XML source for the Statement PDF, Escape, and Format within a <pdf src> tag
					var stmtString = loadedStmtFile.getURL();
					
					var stmtEscape = nlapiEscapeXML(stmtString);
					
					var stmtFileXML = "<pdf src='"+ stmtEscape +"'/>";
					nlapiLogExecution('DEBUG', 'stmtFileXML', stmtFileXML);
				}	
					//Get Open Invoices for the customer, and join into one PDF
					var invSearch = getOpenInvoices(custId, primSubId);
					var openInvCount = 0;
					
					if (invSearch == null){
						nlapiLogExecution('DEBUG', 'invSearch Return Length', 'null');
						//var file = pdfFile;
						sendEmail = 'F';
						nlapiLogExecution('DEBUG', 'No Invoices Primary Subsidiary', 'Do Not Send Email for Prim Sub');
					}
					
					if (invSearch != null && invSearch.length > 75){
						nlapiLogExecution('DEBUG', 'invSearch Return Length', invSearch.length);
						var file = pdfFile;
					}
					
					//if (invSearch && invSearch.length <= 75){
					if (invSearch != null && invSearch.length <= 75){
						nlapiLogExecution('DEBUG', 'invSearch Return Length', invSearch.length);
						
						var invXMLarray = [];
						
						for (var i = 0; i < invSearch.length; i++){
						//for (var i = 0; i < 1; i++){
							
							var invId = invSearch[i].getValue('internalid');
							
							//If Data Migration is checked, Do Not Include Invoice unless it is over 90 days old
							var dataMigration = nlapiLookupField('invoice', invId, 'custbody_data_migration');
							nlapiLogExecution('DEBUG', 'Data Migration for Inv: ' + invId, dataMigration);
							
							if (dataMigration == 'T'){
								
								//Get the Record Creation Date from the Invoice's System Notes
								var invCreateObj = getInvCreateDate(invId);
								
								if (invCreateObj){
									
									var createDate = invCreateObj[0].getValue('date', 'systemnotes');
									nlapiLogExecution('DEBUG', 'Invoice Create Date', createDate);
									
									var invCreateDateObj = new Date(createDate);
									invCreateDateObj.setDate(invCreateDateObj.getDate() + 90);
									var invCreateDate = nlapiDateToString(invCreateDateObj, 'date');
									nlapiLogExecution('DEBUG', 'invCreateDate + 90', invCreateDate);
									
									if (invCreateDateObj.getTime() > today.getTime()){
										nlapiLogExecution('DEBUG', 'Not 90 Days Yet', 'DO NOT INCLUDE INVOICE');
										continue;
									}else{
										nlapiLogExecution('DEBUG', 'Over 90 Days - OK', 'INCLUDE INVOICE');
									}
									
								}
								
							}//End if (dataMigration == 'T')
							
							openInvCount = openInvCount + 1;
							
							//Create the Invoice PDF
							var invPdfFile = nlapiPrintRecord('TRANSACTION', invId, 'PDF', null);
							
							//Save the Statement PDF to the File Cabinet
							invPdfFile.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices

							var pdfInvFileId = nlapiSubmitFile(invPdfFile);
							nlapiLogExecution('DEBUG', 'PDF Inv File Id', pdfInvFileId);
							
							//Store File Id - to be deleted after email has been sent
							filesToDelete.push(pdfInvFileId);
							
							//Load the saved Invoice PDF, and set Available without Logon to true
							var loadedInvFile = nlapiLoadFile(pdfInvFileId);
							loadedInvFile.setIsOnline(true);
							
							//Re-save the Invoice PDF to capture the Available without Login change, and then reload for processing
							pdfInvFileId = nlapiSubmitFile(loadedInvFile);
							loadedInvFile = nlapiLoadFile(pdfInvFileId);
							
							//Get the XML source for the Invoice PDF, Escape, and Format within a <pdf src> tag
							var invString = loadedInvFile.getURL();
							
							var invEscape = nlapiEscapeXML(invString);
							
							var invFileXML = "<pdf src='"+ invEscape +"'/>";
							nlapiLogExecution('DEBUG', 'invFileXML', invFileXML);
							
							//Put all invFileXML results into an array for processing
							invXMLarray.push(invFileXML);
							
						}//End for i loop
						
						var invArrayLength = invXMLarray.length;
						nlapiLogExecution('DEBUG', 'invXMLarray', invXMLarray);
						nlapiLogExecution('DEBUG', 'invArrayLength', invArrayLength);
						
						//Join the PDFs
						var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
							
						xml += "<pdfset>";
						xml +=  stmtFileXML;
						//xml +=  invFileXML;
						if (invArrayLength > 0){
							
							for (var a = 0; a < invArrayLength; a++){
								
								var invoiceFileXML = invXMLarray[a];
								xml +=  invoiceFileXML;
								
							}//End for a loop
							
						}
				    	
						xml += "</pdfset>";
							
						var joinEscape = nlapiEscapeXML(xml);
						nlapiLogExecution('DEBUG', 'joinEscape', joinEscape);	
						var file = nlapiXMLToPDF( xml );
						//nlapiLogExecution('DEBUG', 'file', file);
						
						//Write Joined PDF to File Cabinet
						file.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices
						file.setName('StmtsInvs_' + custName + '_' + primSubsidiary + '.pdf');

						var joinedPDFfileId = nlapiSubmitFile(file);
						nlapiLogExecution('DEBUG', 'joinedPDFfileId', joinedPDFfileId);
						
						//Store File Id - to be deleted after email has been sent
						filesToDelete.push(joinedPDFfileId);
						
						nlapiLogExecution('DEBUG', 'Count of Open Invoices', openInvCount);
					
						
					}//End if (invSearch)
					
				//}//End if (primSubsidiary.indexOf('Jet') == -1)
				
				//END JET IF STATEMENT HERE
				
				
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
					
					
					//START JET IF STATEMENT HERE
					
					//if (primSubsidiary.indexOf('Jet') == -1){//Do NOT Run for 'Jet' subsidiaries
					
					if (sendEmail == 'T'){
					
						//nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false);
						nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, file, true, false);
					
						nlapiLogExecution('DEBUG', 'Send Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
						
					}
						
					//}//End if (primSubsidiary.indexOf('Jet') == -1)
					
					//END JET IF STATEMENT HERE
					
					
					//Check for Non-Primary Subsidiaries, and send additional emails if found
					//var submachineCount = nlapiGetLineItemCount('submachine');
					var submachineCount = custRec.getLineItemCount('submachine');
					nlapiLogExecution('DEBUG', 'submachineCount', submachineCount);
					
					for (var n = 1; submachineCount != 0 && n <= submachineCount; n++){
						
						//Turn sendEmail flag back on for Non-Primary Subsidiary
						sendEmail = 'T';
						
						//var balance = nlapiGetLineItemValue('submachine', 'balance', n);
						//var nonPrimSub = nlapiGetLineItemValue('submachine', 'subsidiary', n);
						//var nonPrimSubName = nlapiGetLineItemText('submachine', 'subsidiary', n);
						//var isPrimeSub = nlapiGetLineItemValue('submachine', 'isprimesub', n);
						var balance = custRec.getLineItemValue('submachine', 'balance', n);
						var nonPrimSub = custRec.getLineItemValue('submachine', 'subsidiary', n);
						var nonPrimSubName = custRec.getLineItemText('submachine', 'subsidiary', n);
						while (nonPrimSubName.indexOf('.') != -1){
							nonPrimSubName = nonPrimSubName.replace(".", "");
						}
						while (nonPrimSubName.indexOf(',') != -1){
							nonPrimSubName = nonPrimSubName.replace(",", "");
						}
						var isPrimeSub = custRec.getLineItemValue('submachine', 'isprimesub', n);
						
						//if (balance > 0 && isPrimeSub == 'F' && nonPrimSubName.indexOf('Jet') == -1){//Do NOT Run for 'Jet' subsidiaries
						if (balance > 0 && isPrimeSub == 'F'){
							nlapiLogExecution('DEBUG', 'Balance FOUND: ' + balance, 'Non-Primary Subsidiary: ' + nonPrimSub);
							nlapiLogExecution('DEBUG', 'Non Primary Sub NAME', nonPrimSubName);
							
							var sProp = new Array();
							//sProp.startdate = '02/07/2008';
							sProp.statementdate = date;
							sProp.openonly = 'T';
							sProp.subsidiary = nonPrimSub;
							
							var pdfFile = nlapiPrintRecord('STATEMENT', custId, 'PDF', sProp);
							
							//Save the Statement PDF to the File Cabinet
							pdfFile.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices
							pdfFile.setName('Statement_' + custName + '_' + nonPrimSubName + '.pdf');

							var pdfStmtFileId = nlapiSubmitFile(pdfFile);
							nlapiLogExecution('DEBUG', 'PDF Statement File Id', pdfStmtFileId);
							
							//Store File Id - to be deleted after email has been sent
							filesToDelete.push(pdfStmtFileId);
							
							//Load the saved statement PDF, and set Available without Logon to true
							var loadedStmtFile = nlapiLoadFile(pdfStmtFileId);
							loadedStmtFile.setIsOnline(true);
							
							//Re-save the Statement PDF to capture the Available without Login change, and then reload for processing 
							pdfStmtFileId = nlapiSubmitFile(loadedStmtFile);
							loadedStmtFile = nlapiLoadFile(pdfStmtFileId);
							
							//Get the XML source for the Statement PDF
							//var stmtString = pdfFile.getValue();
							var stmtString = loadedStmtFile.getURL();
							
							var stmtEscape = nlapiEscapeXML(stmtString);
							
							var stmtFileXML = "<pdf src='"+ stmtEscape +"'/>";
							nlapiLogExecution('DEBUG', 'stmtFileXML', stmtFileXML);
							
							
							//Get Open Invoices for the customer, and join into one PDF
							var invSearch = getOpenInvoices(custId, nonPrimSub);
							var openInvCount = 0;
							
							if (invSearch == null){
								nlapiLogExecution('DEBUG', 'invSearch Return Length', 'null');
								//var file = pdfFile;
								sendEmail = 'F';
								nlapiLogExecution('DEBUG', 'No Invoices Non-Primary Subsidiary', 'Do Not Send Email for Prim Sub: ' + nonPrimSubName);
							}
							
							if (invSearch != null && invSearch.length > 75){
								nlapiLogExecution('DEBUG', 'invSearch Return Length', invSearch.length);
								var file = pdfFile;
							}
							
							//if (invSearch && invSearch.length <= 75){
							if (invSearch != null && invSearch.length <= 75){
								nlapiLogExecution('DEBUG', 'invSearch Return Length', invSearch.length);
								
								var invXMLarray = [];
								
								for (var x = 0; x < invSearch.length; x++){
								//for (var x = 0; x < 1; x++){
									
									var invId = invSearch[x].getValue('internalid');
									
									//If Data Migration is checked, Do Not Include Invoice unless it is over 90 days old
									var dataMigration = nlapiLookupField('invoice', invId, 'custbody_data_migration');
									nlapiLogExecution('DEBUG', 'Data Migration for Inv: ' + invId, dataMigration);
									
									if (dataMigration == 'T'){
										
										//Get the Record Creation Date from the Invoice's System Notes
										var invCreateObj = getInvCreateDate(invId);
										
										if (invCreateObj){
											
											var createDate = invCreateObj[0].getValue('date', 'systemnotes');
											nlapiLogExecution('DEBUG', 'Invoice Create Date', createDate);
											
											var invCreateDateObj = new Date(createDate);
											invCreateDateObj.setDate(invCreateDateObj.getDate() + 90);
											var invCreateDate = nlapiDateToString(invCreateDateObj, 'date');
											nlapiLogExecution('DEBUG', 'invCreateDate + 90', invCreateDate);
											
											if (invCreateDateObj.getTime() > today.getTime()){
												nlapiLogExecution('DEBUG', 'Not 90 Days Yet', 'DO NOT INCLUDE INVOICE');
												continue;
											}else{
												nlapiLogExecution('DEBUG', 'Over 90 Days - OK', 'INCLUDE INVOICE');
											}
											
										}
										
									}//End if (dataMigration == 'T')
									
									openInvCount = openInvCount + 1;
									
									//Create the Invoice PDF
									var invPdfFile = nlapiPrintRecord('TRANSACTION', invId, 'PDF', null);
									
									//Save the Statement PDF to the File Cabinet
									invPdfFile.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices

									var pdfInvFileId = nlapiSubmitFile(invPdfFile);
									nlapiLogExecution('DEBUG', 'PDF Inv File Id', pdfInvFileId);
									
									//Store File Id - to be deleted after email has been sent
									filesToDelete.push(pdfInvFileId);
									
									//Load the saved Invoice PDF, and set Available without Logon to true
									var loadedInvFile = nlapiLoadFile(pdfInvFileId);
									loadedInvFile.setIsOnline(true);
									
									//Re-save the Invoice PDF to capture the Available without Login change, and then reload for processing
									pdfInvFileId = nlapiSubmitFile(loadedInvFile);
									loadedInvFile = nlapiLoadFile(pdfInvFileId);
									
									//Get the XML source for the Invoice PDF, Escape, and Format within a <pdf src> tag
									var invString = loadedInvFile.getURL();
									
									var invEscape = nlapiEscapeXML(invString);
									
									var invFileXML = "<pdf src='"+ invEscape +"'/>";
									nlapiLogExecution('DEBUG', 'invFileXML', invFileXML);
									
									//Put all invFileXML results into an array for processing
									invXMLarray.push(invFileXML);
									
								}//End for x loop
								
								var invArrayLength = invXMLarray.length;
								nlapiLogExecution('DEBUG', 'invXMLarray', invXMLarray);
								nlapiLogExecution('DEBUG', 'invArrayLength', invArrayLength);
								
								//Join the PDFs
								var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
									
								xml += "<pdfset>";
								xml +=  stmtFileXML;
								//xml +=  invFileXML;
								if (invArrayLength > 0){
									
									for (var z = 0; z < invArrayLength; z++){
										
										var invoiceFileXML = invXMLarray[z];
										xml +=  invoiceFileXML;
										
									}//End for z loop
									
								}
						    	
								xml += "</pdfset>";
									
								var joinEscape = nlapiEscapeXML(xml);
								nlapiLogExecution('DEBUG', 'joinEscape', joinEscape);	
								var file = nlapiXMLToPDF( xml );
								//nlapiLogExecution('DEBUG', 'file', file);
								
								//Write Joined PDF to File Cabinet
								file.setFolder(CUST_STMTS_INV_FOLDER);//Customer Statements and Invoices
								file.setName('StmtsInvs_' + custName + '_' + nonPrimSubName + '.pdf');

								var joinedPDFfileId = nlapiSubmitFile(file);
								nlapiLogExecution('DEBUG', 'joinedPDFfileId', joinedPDFfileId);
								
								//Store File Id - to be deleted after email has been sent
								filesToDelete.push(joinedPDFfileId);
									
								
								nlapiLogExecution('DEBUG', 'Count of Open Invoices', openInvCount);
							
								
							}//End if (invSearch)
							
							//Get necessary information, and send email for Non-Primary Subsidiary details
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
							
							if (sendEmail == 'T'){
							
								//nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false);
								nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, null, null, records, file, true, false);
							
								nlapiLogExecution('DEBUG', 'Send Non-Primary Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
								
							}
							
						}//End if (balance > 0 && isPrimeSub == 'F')
						
					}//End for n loop
					
				}//End if(recipient != null)
				
				
				count = count + 1;
				
				//Delete Processed Files from File Cabinet
				var files2DelArrayLength = filesToDelete.length;
				nlapiLogExecution('DEBUG', 'Files to Delete', filesToDelete);
				nlapiLogExecution('DEBUG', 'files2DelArrayLength', files2DelArrayLength);
				
				if (files2DelArrayLength > 0){
					
					for (var d = 0; d < files2DelArrayLength; d++){
						
						var delFileId = filesToDelete[d];
						//nlapiLogExecution('DEBUG', 'Delete File: ' + delFileId, 'DELETE');
						nlapiDeleteFile(delFileId);
						
					}//End for d loop
					
				}//End if (files2DelArrayLength > 0)
				
				//UnCheck Processing Incomplete Checkbox
				//nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_incomplete', 'F');
				nlapiSubmitField('customer', custId, ['custentity_scg_stmt_inv_proc_incomplete', 'custentity_scg_stmt_inv_proc_error'], ['F', '']);
				
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('ERROR','Usage Exceeded on script:', 'SCG_sentJoinedStmtsInvoices_SS');
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', custId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
					nlapiSubmitField('customer', custId, 'custentity_scg_stmt_inv_proc_error', errorMessage);
				}
			}
		});
		
		// Check for any additional records
		minRecId = custId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		customerIds = is_ijsi_getCustomerIds(minRecId);
		
	}//End while loop
	
	//nlapiLogExecution('DEBUG', 'Files to Delete', filesToDelete);
	
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
function is_ijsi_scheduledBatch(arr, proc) {

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
		if (endUsage < (maxUsage + 100)){//Changed from 40 - 100 (DH) to see if it reduces failures
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
 * Returns a list of Customer Records to be processed (to join statements / invoices, and email)
 * 
 * @appliedtorecord customer
 * 
 * @returns {nlobjSearch}
 */
function is_ijsi_getCustomerIds(minRecId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custentity_scg_stmt_inv_proc_incomplete', null, 'is', 'T'));
	//filters.push(new nlobjSearchFilter('balance', null, 'greaterthan', '0.00'));
	filters.push(new nlobjSearchFilter('fxbalance', null, 'greaterthan', '0.00'));
	//filters.push(new nlobjSearchFilter('daysoverdue', null, 'greaterthanorequalto', '30'));
	//filters.push(new nlobjSearchFilter('custentity_disable_invoice_email_notice', null, 'is', 'F'));
	//filters.push(new nlobjSearchFilter('custentity_scg_mult_inv_emails', null, 'isnotempty', ''));
	//filters.push(new nlobjSearchFilter('custrecord_subsidiary_group', 'msesubsidiary', 'noneof', SUB_GROUP_JET_GLOBAL));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['1347', '21137']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['1553211']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('altname', null, null));
	columns.push(new nlobjSearchColumn('entityid', null, null));
	columns.push(new nlobjSearchColumn('daysoverdue', null, null));
	columns.push(new nlobjSearchColumn('balance', null, null));
	columns.push(new nlobjSearchColumn('custentity_scg_mult_inv_emails', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('customer', null, filters, columns);
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





function getOpenInvoices(customer, subsidiary){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'anyof', customer));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('status', null, 'anyof', 'CustInvc:A'));
	//filters.push(new nlobjSearchFilter('custrecord_subsidiary_group', 'subsidiary', 'noneof', SUB_GROUP_JET_GLOBAL));
	filters.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiary));
	filters.push(new nlobjSearchFilter('posting', null, 'is', 'T'));
	//filters.push(new nlobjSearchFilter('daysoverdue', null, 'greaterthanorequalto', '30'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('invoice', null, filters, columns);
	  
	// Return
	return results;
	
}





function getInvCreateDate(invId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', invId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('type', 'systemnotes', 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('date', 'systemnotes', null));
	columns[0].setSort(false /* ascending */);
	  
	// Get results
	var results = nlapiSearchRecord('invoice', null, filters, columns);
	  
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



