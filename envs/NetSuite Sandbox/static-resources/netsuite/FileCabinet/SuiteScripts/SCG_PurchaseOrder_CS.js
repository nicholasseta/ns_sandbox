/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Aug 2018     Doug Humberd     Handles client events on Purchase Order records
 * 1.10       10 Aug 2018     Doug Humberd     Added fieldChanged function, and an IT Manager Check when an CapEx item is entered
 * 1.15       23 Mar 2021     Doug Humberd     Updated all functions for new WF - Certent Purchase Order Approval
 * 1.16       25 Mar 2021     Doug Humberd     Added 'Super Approver' logic
 * 1.20       17 Jun 2021     Doug Humberd     Added 'is_po_vendCntctEmailChk' to validate that there is a valid email on either the vendor record or on any Primary Contact
 * 1.25       18 Jun 2021     Doug Humberd     Added 'is_po_sendDelayedVendEmail' to send email to vendor on button click (via Suitelet)
 * 1.26       18 Jun 2021     Doug Humberd     Added 'is_po_confirmFilesAndApprove'
 * 1.30       04 Aug 2021     Doug Humberd     Updated 'is_po_vendCntctEmailChk' to not run if Vendor > Represents Subsidiary is populated (is intercompany vendor)
 * 1.35       22 Mar 2022     Doug Humberd     Added 'Close PO' functionality
 * 1.40       23 Mar 2022     Doug Humberd     Updated 'is_po_confirmFilesAndApprove' to no longer prompt user for file attachment to vendor
 *
 */


/**
 * Constants
 */



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord purchaseorder
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_po_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_po_fieldChanged(type, name, linenum){
    try {
        //is_po_ITMgrCheck(type, name, linenum);//moved to postSourcing
    } catch (e) {
    	is_po_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_po_postSourcing(type, name) {
    try {
    	is_po_ITMgrCheck(type, name);
    	is_po_vendCntctEmailChk(type, name);
    } catch (e) {
    	is_po_logError(e);
        throw e;
    }
}


/**
 * Records the rejection reason on a purchase order
 *  
 * @appliedtorecord purchaseorder
 *   
 * @returns {Void}
 */
function is_po_rejectionPopup() {
	var reason = prompt('Enter rejection reason below:',''); 
	if (reason != null) {
		var poRec = nlapiGetRecordId()
		nlapiSubmitField('purchaseorder', poRec, 'custbody_scg_reject_reason_po', reason);
		//var currentState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		var currentState = nlapiLookupField('purchaseorder', poRec, 'custbody_scg_po_appvl_current_state');
		nlapiLogExecution('DEBUG', 'Current State', currentState);

		window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=REJECTION' + '&currentstate=' + currentState + '&inclfiles=NONE&exclfiles=NONE';
	}
}






/**
 * Triggers Suitelet when the Approve Button is clicked
 *  
 * @appliedtorecord purchaseorder
 *   
 * @returns {Void}
 */
function is_po_approveClicked() {
		
	var poId = nlapiGetRecordId();
	//alert ('poId = ' + poId);
	
	var poRecType = nlapiGetRecordType();
	//alert('poRecType = ' + poRecType);
	
	var cState = nlapiLookupField(poRecType, poId, 'custbody_scg_po_appvl_current_state');
	//alert('Current State = ' + cState);
	
	
	window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=APPROVAL' + '&porectype=' + poRecType + '&currentstate=' + cState + '&inclfiles=NONE&exclfiles=NONE';

}





function is_po_confirmFilesAndApprove(){
	
	var poId = nlapiGetRecordId();
	//alert ('poId = ' + poId);
	
	var poRecType = nlapiGetRecordType();
	//alert('poRecType = ' + poRecType);
	
	var cState = nlapiLookupField(poRecType, poId, 'custbody_scg_po_appvl_current_state');
	//alert('Current State = ' + cState);
	
	var inclFiles;
	var exclFiles;
	
	
	/*
	
	//Loop through Attached Files, if any, and confirm (flag) which should be included on Vendor Email 
	var attachFilesSearch = getAttachedFiles(poId);
	
	if (attachFilesSearch){
		
		for (var x = 0; x < attachFilesSearch.length; x++){
			
			var attachFileId = attachFilesSearch[x].getValue('internalid', 'file');
			nlapiLogExecution('DEBUG', 'Attach File', attachFileId);
			
			var attachFileName = attachFilesSearch[x].getValue('name', 'file');
			nlapiLogExecution('DEBUG', 'Attach File Name', attachFileName);
			
			if (!isEmpty(attachFileId)){
				
				if (confirm('Do you want the following file attached to the email that gets sent to the Vendor?\n\n' + attachFileName + '\n\nClick OK to Include.  Click Cancel to Exclude.')){
					
					//alert('Include File: ' + attachFileName + '\n\nFile Int Id: ' + attachFileId);
					
					if (isEmpty(inclFiles)){
						inclFiles = attachFileId;
					}else{
						inclFiles = inclFiles + '-' + attachFileId;
					}
					
				}else{
					
					//alert('Exclude File: ' + attachFileName + '\n\nFile Int Id: ' + attachFileId);
					
					if (isEmpty(exclFiles)){
						exclFiles = attachFileId;
					}else{
						exclFiles = exclFiles + '-' + attachFileId;
					}
					
				}//End confirm
				
			}//End if (!isEmpty(attachFileId))
			
		}//End for x loop
		
	}//End if (attachFilesSearch)
	
	*/
	
	
	if (isEmpty(inclFiles)){
		inclFiles = 'NONE';
	}
	if (isEmpty(exclFiles)){
		exclFiles = 'NONE';
	}
	
	//alert ('Include Files: ' + inclFiles + '\nExclude Files: ' + exclFiles);

	
	
	window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=APPROVAL' + '&porectype=' + poRecType + '&currentstate=' + cState + '&inclfiles=' + inclFiles + '&exclfiles=' + exclFiles;
	
}





function is_po_closePO(){
	
	//alert('Close PO Clicked');
	
	var confirmClose = confirm('Are you sure you wish to close this PO?');
	//alert ('Confirm Response: ' + confirmClose);
	
	if (confirmClose == true){
		
		var poId = nlapiGetRecordId();
		//alert ('poId = ' + poId);
		
		var poRecType = nlapiGetRecordType();
		//alert('poRecType = ' + poRecType);
		
		var cState = nlapiLookupField(poRecType, poId, 'custbody_scg_po_appvl_current_state');
		//alert('Current State = ' + cState);
		
		window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=CLOSE' + '&porectype=' + poRecType + '&currentstate=' + cState + '&inclfiles=NONE&exclfiles=NONE';
		
	}
	
}





function getAttachedFiles(poId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', poId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	//filters.push(new nlobjSearchFilter('description', 'file', 'contains', 'SEND_TO_VENDOR'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', 'file', null));
	columns.push(new nlobjSearchColumn('name', 'file', null));
	  
	// Get results
	var results = nlapiSearchRecord('purchaseorder', null, filters, columns);
	  
	// Return
	return results;
	
}






/**
 * Triggers Suitelet when the Super Approver Button is clicked
 *  
 * @appliedtorecord purchaseorder
 *   
 * @returns {Void}
 */
function is_po_superApproverClicked(){
	
	var poId = nlapiGetRecordId();
	//alert ('poId = ' + poId);
	
	var poRecType = nlapiGetRecordType();
	//alert('poRecType = ' + poRecType);
	
	var cState = nlapiLookupField(poRecType, poId, 'custbody_scg_po_appvl_current_state');
	//alert('Current State = ' + cState);
	
	
	window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=SUPER' + '&porectype=' + poRecType + '&currentstate=' + cState;
	
}






/**
 * Checks to see if Vendor has a valid email when entered, or
 * if there is a a valid email on any contact where Role = Primary Contact
 * If no emails found, clear out Vendor value
 *  
 * @appliedtorecord purchaseorder
 *   
 * @returns {Void}
 */
function is_po_vendCntctEmailChk(type, name){
	
	if (name == 'entity'){
		
		var emailFound = 'F';
		
		var vendId = nlapiGetFieldValue('entity');
		
		//Only run if a vendor was entered
		if (isEmpty(vendId)){
			return;
		}
		
		//Check if there is a valid email on the Vendor Record
		var vendRec = nlapiLoadRecord('vendor', vendId);
		
		//Only run if Vendor is not intercompany (representingsubsidiary is empty)
		var repSub = vendRec.getFieldValue('representingsubsidiary');
		//alert ('Represents Subsidiary = ' + repSub);
		
		if (!isEmpty(repSub)){
			return;
		}
		
		var vendEmail = vendRec.getFieldValue('email');
		//alert ('Vendor Email: ' + vendEmail);
		
		if (!isEmpty(vendEmail)){
			emailFound = 'T';
		}
		
		if (emailFound == 'F'){
			
			var searchresults = getVendorContacts(vendId);
			
			if (searchresults){
				
				for (var i = 0; i < searchresults.length; i++){
					
					var contactId = searchresults[i].getValue('internalid');
					var contactRole = searchresults[i].getValue('contactrole');
					var contactEmail = searchresults[i].getValue('email');
					
					//alert ('Contact ID = ' + contactId + '\nContact Role = ' + contactRole + '\nContact Email = ' + contactEmail);
					
					if (contactRole == -10 && !isEmpty(contactEmail)){//-10 = Primary Contact
						emailFound = 'T';
						break;
					}
					
				}//End for i loop
				
			}//End if (searchresults)
			
		}
		
		if (emailFound == 'F'){
			alert ('*** UNABLE TO USE THIS VENDOR - EMAIL ADDRESSES NOT FOUND ***\n\nThere is no valid email address on this vendor, nor are there any Primary Contacts for this vendor with a valid email address.\n\nPlease update the vendor record appropriately and retry.\n');
			nlapiSetFieldValue('entity', '', false, true);
		}

		
	}//End if (name == 'entity')
	
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





function is_po_sendDelayedVendEmail(){
	
	try{
		
		nlapiLogExecution('DEBUG', 'sendDelayedVendEmail', 'START');
		//alert ('Send Delayed Vendor Email Clicked...');

		//Initalize Variables
		var poId = nlapiGetRecordId();
		
		window.location = nlapiResolveURL('SUITELET', 'customscript_scg_senddelvendemail_sl', 'customdeploy_scg_senddelvendemail_sl') + '&poid=' + poId;
		
		return;
		alert('After Return');
		
	} catch(e) {
		is_po_logError(e);
		return 0;
	}
	
}






/**
 * Checks to see if the item entered is a Capital Expense item.  
 * If it is, it will verify that the employee is flagged as an IT Manager.
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_po_ITMgrCheck(type, name, linenum){
	
	if (name == 'item'){
		
		var itemEntered = nlapiGetCurrentLineItemValue('item', 'item');
		//alert('Item Entered = ' + itemEntered);
		
		if (isEmpty(itemEntered)){
			return;
		}

		//var capexItem = nlapiLookupField('item', itemEntered, 'custitem_fixedasset');
		var capexItem = nlapiGetCurrentLineItemValue('item', 'custcol_scg_fixed_asset');
		//alert ('capexItem = ' + capexItem);

		if (capexItem == 'T'){
			
			//var employee = nlapiGetFieldValue('employee');
			//var itMgr = nlapiLookupField('employee', employee, 'custentity_it_manager');
			var itMgr = nlapiGetFieldValue('custbody_scg_it_manager');
			//alert ('IT Manager = ' + itMgr);

			if (itMgr == 'F'){
				alert ('Only an IT Manager is allowed to enter a Capital Expense item on a Purchase Request');
				nlapiSetCurrentLineItemValue('item', 'item', '');
			}
			
		}
		
	}
	
}



function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}


