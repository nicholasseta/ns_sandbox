/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Mar 2021     Doug Humberd     Scheduled Script to send PO Approval Reminder Emails
 * 1.05       26 Apr 2021     Doug Humberd     Updated for reworked PO Approval WF
 * 1.10       24 May 2021     Doug Humberd     Updated to include all attachments in email
 * 1.15       21 Feb 2022     Doug Humberd     Updated to email Purchasing if ELT Reminder is to be sent out
 * 1.20       16 Mar 2022     Doug Humberd     Updated for scenarios where the Next Approver is the dummy employee 'Inactive Approver'
 * 1.25       11 May 2022     Doug Humberd     Updated for new "Employee Hierarchy" workflow updates
 *
 */


/**
 * Constants
 */
const PURCHASING_EMAIL = 'purchasing@insightsoftware.com';//Purchasing Email Address
const INACTIVE_APPROVER = 13207923;//Employee: Inactive Approver
const PROCUREMENT_TEAM = 12297611;//Employee: Procurement Team


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_sendReminderEmail_logError(e) {
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
function is_sendReminderEmail(type){
	
	nlapiLogExecution('DEBUG', 'is_sendReminderEmail', 'START');
	
	var poId;
	var lastId;
	var minRecId = 0;
	var recipient;
	
	var is_spre_context = nlapiGetContext();
	
	var startUsage = is_spre_context.getRemainingUsage();
	nlapiLogExecution('DEBUG', 'Start Usage', startUsage);
	
	
	var date = new Date();
	var today = nlapiDateToString(date, 'date');
	nlapiLogExecution('DEBUG', 'Today', today);
	
	//today = '2/25/2022';//TEMP CODE

	
	//Get a list of Purchase Orders that need reminder emails sent out for
	var poIds = is_getPurchOrdIds(minRecId, today);
	
	
	var count = 0;
	
	nlapiLogExecution('DEBUG', 'poIds Length', poIds.length);
	
	
	//Loop through purchase order list and send emails
	while (poIds && poIds.length > 0){
		
		// Loop through the results and update them
		is_spre_scheduledBatch(poIds, function (poId) {
			try{
				
				purchaseorderId = poId.getValue('internalid');
				
				if (purchaseorderId != lastId){
					
					lastId = purchaseorderId;
					//nlapiLogExecution('DEBUG', 'poId', purchaseorderId);

					poRec = nlapiLoadRecord('purchaseorder', purchaseorderId);
					
					var employee = poRec.getFieldValue('employee');
					var nextApprover = poRec.getFieldValue('nextapprover');
					var cState = poRec.getFieldValue('custbody_scg_po_appvl_current_state');
					var po_tranid = poRec.getFieldValue('tranid');
					
					nlapiLogExecution('DEBUG', 'Employee', employee);
					nlapiLogExecution('DEBUG', 'Next Approver', nextApprover);
					nlapiLogExecution('DEBUG', 'Current State', cState);
					nlapiLogExecution('DEBUG', 'PO TranID', po_tranid);
					
					
					if (nextApprover == INACTIVE_APPROVER){
						nlapiLogExecution('DEBUG', 'Next Approver is Inactive Approver', 'Set Next Approver = Procurement Team');
						nextApprover = PROCUREMENT_TEAM;
					}
					
					
					var employeeFields = nlapiLookupField('employee', employee, ['firstname', 'lastname', 'email']);
					var empfirst = employeeFields['firstname'];
					var emplast = employeeFields['lastname'];
					var empemail = employeeFields['email'];
					
					var nextApproverFields = nlapiLookupField('employee', nextApprover, ['firstname', 'lastname', 'email']);
					var nxtappfirst = nextApproverFields['firstname'];
					var nxtapplast = nextApproverFields['lastname'];
					//var nxtappemail = nextApproverFields['email'];
					
					
					
					/*
					
					//Send Appropriate Reminder Email based on which State the Workflow is in
					if (cState == '3'){//Department Approval State - Send Notification Email to Appropriate ELT Member
						
						var deptApprover;
						var eltMember;
						
						var deptApprCount = 5;//Could potentially have 5 different department approvers to cycle through
						
						for (var x = 1; x <= deptApprCount; x++){
							
							var deptApproverIntId = 'custbody_department_approver_' + x;
							nlapiLogExecution('DEBUG', 'Department Approver Internal Id', deptApproverIntId);
							
							//deptApprover = nlapiGetFieldValue(deptApproverIntId);
							deptApprover = poRec.getFieldValue(deptApproverIntId);
							nlapiLogExecution('DEBUG', 'Department Approver ' + x, deptApprover);
							
							
							//If Department Approver = Next Approver, get the ELT Member
							if (!isEmpty(deptApprover) && deptApprover == nextApprover){
								
								var eltMemberIntId = 'custbody_scg_elt_member_' + x;
								nlapiLogExecution('DEBUG', 'ELT Member Internal Id', eltMemberIntId);
								
								//eltMember = nlapiGetFieldValue(eltMemberIntId);
								eltMember = poRec.getFieldValue(eltMemberIntId);
								nlapiLogExecution('DEBUG', 'ELT Member', eltMember);
								
								var eltMemberFields = nlapiLookupField('employee', eltMember, ['firstname', 'lastname', 'email']);
								var eltmemfirst = eltMemberFields['firstname'];
								var eltmemlast = eltMemberFields['lastname'];
								
								
								var emailSubj = 'PLEASE BE ADVISED: Purchase Order ' + po_tranid + ' Waiting on Department Approval';
								
								var string = 'View Record';
								var po_url = nlapiResolveURL('RECORD', 'purchaseorder', purchaseorderId);
								var hyperlink = string.link(po_url);
								
								//var emailBody = 'Hello ' + eltmemfirst + ' ' + eltmemlast + ',<br><br>PLEASE BE ADVISED: Purchase Order ' + po_tranid + ' is still waiting for your Approval and Verification.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=approve&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=reject&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br><b>' + hyperlink + '</b>';
								var emailBody = 'Hello ' + eltmemfirst + ' ' + eltmemlast + ',<br><br>PLEASE BE ADVISED: Purchase Order ' + po_tranid + ' is waiting for Department Approval and Verification from ' + nxtappfirst + ' ' + nxtapplast + '.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br><b>' + hyperlink + '</b>';
								
								var emailAttachment = nlapiPrintRecord('TRANSACTION', purchaseorderId, 'PDF', null);
								var records = new Object();
								records['transaction'] = purchaseorderId;
								
								nlapiSendEmail(employee, eltMember, emailSubj, emailBody, null, null, records, emailAttachment);
								
								
								break;
								
							}//End if (!isEmpty(deptApprover) && deptApprover == nextApprover)
							
							
						}//End for x loop
						
						
					}//End if (cState == '3')
					
					*/
					
					
					
					//if (cState == '2' || cState == '3' || cState == '4' || cState == '5' || cState == '6' || cState == '7'){//Send Reminder Email to Next Approver
					if (cState == '2' || cState == '5' || cState == '6' || cState == '7'){//Send Reminder Email to Next Approver
						
						//var emailSubj = 'REMINDER: Purchase Order ' + po_tranid + ' Requires Your Approval';
						
						//if (cState == '4'){
							//var emailSubj = 'REMINDER NOTIFICATION: Purchase Order ' + po_tranid + ' Requires ELT Approval';
						//}else{
							var emailSubj = 'REMINDER: Purchase Order ' + po_tranid + ' Requires Your Approval';
						//}
						
						var files = [];
						var string = 'View Record';
						var po_url = nlapiResolveURL('RECORD', 'purchaseorder', purchaseorderId);
						var hyperlink = string.link(po_url);
						
						//var emailBody = 'Hello ' + nxtappfirst + ' ' + nxtapplast + ',<br><br>REMINDER: Purchase Order ' + po_tranid + ' is still waiting for your Approval and Verification.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=approve&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=753&deploy=1&compid=5172601_SB1&h=b920f4f6244cffd267f4&action=reject&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br><b>' + hyperlink + '</b>';
						//var emailBody = 'Hello ' + nxtappfirst + ' ' + nxtapplast + ',<br><br>REMINDER: Purchase Order ' + po_tranid + ' is still waiting for your Approval and Verification.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601_SB1&h=9ec59b3e7c8506b28639&action=approve&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601_SB1&h=9ec59b3e7c8506b28639&action=reject&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br>';
						
						//if (cState == '4'){
							//var emailBody = 'Purchasing Team,<br><br>REMINDER NOTIFICATION: Purchase Order ' + po_tranid + ' is waiting for ELT Approval and Verification from ' + nxtappfirst + ' ' + nxtapplast + '.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br>';
						//}else{
							var emailBody = 'Hello ' + nxtappfirst + ' ' + nxtapplast + ',<br><br>REMINDER: Purchase Order ' + po_tranid + ' is still waiting for your Approval and Verification.<br><br>Employee: ' + empfirst + ' ' + emplast + '<br><br><p><a href="https://5172601.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601&h=b3c9438d69dcf70a7e46&action=approve&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Approve</a></p><p><a href="https://5172601.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=815&deploy=1&compid=5172601&h=b3c9438d69dcf70a7e46&action=reject&poid=' + purchaseorderId + '&porectype=purchaseorder&approver=' + nextApprover + '&cstate=' + cState + '">Click to Reject</a><br></p><br><br>Please contact me if you have any questions.<br><br>' + empfirst + ' ' + emplast + '<br>' + empemail + '<br><br>';
						//}
						
						var emailAttachment = nlapiPrintRecord('TRANSACTION', purchaseorderId, 'PDF', null);
						
						files.push(emailAttachment);
						nlapiLogExecution('DEBUG', 'Files - Only Transaction PDF', files);
						
						
						//Get Files to Attach, if any, and put into array
						var attachFilesSearch = getFilesToAttach(purchaseorderId);
						
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
						records['transaction'] = purchaseorderId;
						
						//nlapiSendEmail(employee, nextApprover, emailSubj, emailBody, null, null, records, emailAttachment);
						//nlapiSendEmail(employee, nextApprover, emailSubj, emailBody, null, null, records, files);
						
						//if (cState == '4'){
							//nlapiSendEmail(employee, PURCHASING_EMAIL, emailSubj, emailBody, null, null, records, files);
						//}else{
							nlapiSendEmail(employee, nextApprover, emailSubj, emailBody, null, null, records, files);
						//}
						
					}//End if (cState == '2' || cState == '3' || cState == '4' || cState == '5' || cState == '6' || cState == '7')
					
					
					//Recalculate and Update the Reminder Date
					var remDate = poRec.getFieldValue('custbody_scg_unappr_po_rem_date');
					nlapiLogExecution('DEBUG', 'Current Reminder Date', remDate);
					
					var dt = new Date(remDate);
					nlapiLogExecution('DEBUG', 'Reminder Date Obj', dt);
					
					dt.setDate(dt.getDate() + 4);
					
					//If 4 days from now includes either weekend day, add additional days
					var dayOfWeek = dt.getDay();
					if (dayOfWeek == 0 || dayOfWeek == 1 || dayOfWeek == 2 || dayOfWeek == 6){//0 = Sunday, 1 = Monday, 2 = Tuesday, 6 = Saturday
						dt.setDate(dt.getDate() + 2);
					}
					if (dayOfWeek == 3){//3 = Wednesday
						dt.setDate(dt.getDate() + 1);
					}
					
					var nextReminderDate = nlapiDateToString(dt, 'date');
					nlapiLogExecution('DEBUG', 'Four Days from Current Reminder Date)', nextReminderDate);
					
					poRec.setFieldValue('custbody_scg_unappr_po_rem_date', nextReminderDate);
					
					nlapiSubmitRecord(poRec);
					

					
					count = count + 1;

					
				}//End if (purchaseorderId != lastId)
				
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('debug','Usage Exceeded on script:', 'SCG_sendPOApprvlReminderEmail_SS');
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', purchaseorderId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
						nlapiLogExecution('DEBUG', 'Purchase Order ID at Error', purchaseorderId);
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
				}
			}
		});
		
		
		var endUsage = is_spre_context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'End Usage', endUsage);
		
		// Check for any additional records
		minRecId = purchaseorderId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		poIds = is_getPurchOrdIds(minRecId, today);
		
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
function is_spre_scheduledBatch(arr, proc) {

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
 * Returns a list of purchase order records to be processed
 * 
 * @appliedtorecord purchaseorder
 * 
 * @returns {nlobjSearch}
 */
function is_getPurchOrdIds(minRecId, today) {
	
	nlapiLogExecution('DEBUG', 'In Search', today);
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custbody_scg_unappr_po_rem_date', null, 'on', today));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('custbody_scg_po_appvl_current_state', null, 'anyof', ['2', '3', '4', '5', '6', '7']));//Director, VP/SVP/GM, ELT Member, Head of FP&A, CFO, CEO stages
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custbody_scg_po_appvl_current_state', null, null));
	columns.push(new nlobjSearchColumn('nextapprover', null, null));
	//columns.push(new nlobjSearchColumn('created', null, null).setSort(false /* ascending */));

	return nlapiSearchRecord('purchaseorder', null, filters, columns);
}






function getFilesToAttach(purchaseorderId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', purchaseorderId));
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



