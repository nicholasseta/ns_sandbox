/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2018     Doug Humberd     Copies 'End User' and 'Partner/JV/Reseller' changes from Sales Transactions (SO, Cash Sale, Inv, CM, Ret Auth) to Revenue Arrangement
 * 1.05       13 Dec 2018     Doug Humberd     Update to run script if the "Trigger Script WF" field is modified on source transaction records
 * 1.10       10 Jun 2019     Doug Humberd     Updated to include 'Distributor' field
 *
 */


/**
 * Copies End User and Partner/JV/Reseller from Sales Transaction to Revenue Arrangement
 *
 * @appliedtorecord salesorder
 * @appliedtorecord cashsale
 * @appliedtorecord invoice
 * @appliedtorecord creditmemo
 * @appliedtorecord returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function scg_ra_updateRevArgmt(type) {
	// Only run on edit
	if (type != 'edit')
		return;
	
	// Initialize variables
	var oldSoRec = nlapiGetOldRecord();
	var newSoRec = nlapiGetNewRecord();
	
	var enduser = newSoRec.getFieldValue('custbody_so_enduser');
	var partner = newSoRec.getFieldValue('custbody_partnerjvreseller');
	var distributor = newSoRec.getFieldValue('custbody_distributor');
	var trigger = newSoRec.getFieldValue('custbody_trigger_script_wf');//This field is used to trigger the script to update pre-existing records
	
	var isChanged = (oldSoRec) ? scg_ra_compareFields(oldSoRec, enduser, partner, distributor, trigger) : (type == 'create') ? true : false;
	
	nlapiLogExecution('DEBUG', 'isChanged', isChanged);
	
	if (isChanged){
		// Update the Revenue Arrangement
		//scg_ra_updateRevenueArrangementId(newSoRec, linesToProcess);
		scg_ra_updateRevenueArrangementId(newSoRec);
	}
	
	// Look for lines with new/changed Rev Rec dates
	//var linesToProcess = [];
	//var itemCount = newSoRec.getLineItemCount('item');
	//for (var i=1; itemCount != 0 && i <= itemCount; i++) {
		//var revRecStart = newSoRec.getLineItemValue('item', 'custcol_rev_rec_start_date', i);
		//var revRecEnd = newSoRec.getLineItemValue('item', 'custcol_rev_rec_end_date', i);
		//var uniqueLineId = newSoRec.getLineItemValue('item', 'lineuniquekey', i);
		//var isChanged = (oldSoRec) ? scg_ra_compareDates(oldSoRec, uniqueLineId, revRecStart, revRecEnd) : (type == 'create') ? true : false;

		
		//if (isChanged) {
            //linesToProcess.push({'solinenum': i, 'souniquelineid': uniqueLineId, 'revrecstart': revRecStart, 'revrecend': revRecEnd});
		//}
	//}
	
	//nlapiLogExecution('DEBUG', 'linesToProcess.length', linesToProcess.length);
	
	// Update the Revenue Arrangement
	//if (linesToProcess && linesToProcess.length > 0) {
		//scg_ra_updateRevenueArrangementId(newSoRec, linesToProcess);
	//}
}


/**
 * Compares End User and Partner/JV/Reseller fields between new and old versions of the transaction record
 *
 * @appliedtorecord salesorder
 * @appliedtorecord cashsale
 * @appliedtorecord invoice
 * @appliedtorecord creditmemo
 * @appliedtorecord returnauthorization
 * 
 * @param {nlobjRecord} oldSoRec the version of the Transaction record prior to editing
 * @param {Integer} uniqueLineId the line whose rev rec dates are being compared
 * @param {String} revRecStart the rev rec start date
 * @param {String} revRecEnd the rev rec end date
 * 
 * @returns {Boolean}
 */
function scg_ra_compareFields(oldSoRec, enduser, partner, distributor, trigger) {
	nlapiLogExecution('DEBUG', 'compareDates Function', 'Running');
	// Initialize variables
	var isChanged = true;
	nlapiLogExecution('DEBUG', 'enduser = ' + enduser, 'partner = ' + partner);
	nlapiLogExecution('DEBUG', 'distributor', distributor);
	nlapiLogExecution('DEBUG', 'trigger', trigger);
	
	var oldEnduser = oldSoRec.getFieldValue('custbody_so_enduser');
	var oldPartner = oldSoRec.getFieldValue('custbody_partnerjvreseller');
	var oldDistributor = oldSoRec.getFieldValue('custbody_distributor')
	var oldTrigger = oldSoRec.getFieldValue('custbody_trigger_script_wf');
	
	nlapiLogExecution('DEBUG', 'old enduser = ' + oldEnduser, 'old partner = ' + oldPartner);
	nlapiLogExecution('DEBUG', 'old distributor', oldDistributor);
	nlapiLogExecution('DEBUG', 'old trigger', oldTrigger);
	
	if (oldEnduser == enduser && oldPartner == partner && oldDistributor == distributor && oldTrigger == trigger){
		isChanged = false;
	}
	
	// Compare the rev rec dates
	//var lineNumber = nlapiFindLineItemValue('item', 'lineuniquekey', uniqueLineId);
	//nlapiLogExecution('DEBUG', 'Line Unique Key', lineNumber);
	//if (lineNumber > 0) {
		//var oldRevRecStart = oldSoRec.getLineItemValue('item', 'custcol_rev_rec_start_date', lineNumber);
		//var oldRevRecEnd = oldSoRec.getLineItemValue('item', 'custcol_rev_rec_end_date', lineNumber);
		//if (oldRevRecStart == revRecStart && oldRevRecEnd == revRecEnd) {
			//isChanged = false;
		//}
	//}
	
	// Return result
	return isChanged;
}


/**
 * Updates the Revenue Arrangement with the new End User and Partner/JV/Reseller values
 * 
 * @appliedtorecord revenuearrangement
 * 
 * @param {nlobjRecord} soRec the Sales Order record
 * @param {Object} linesToProcess an object containing info required to update rev rec dates on the rev arrangement
 * 
 * @returns {Void}
 */
//function scg_ra_updateRevenueArrangementId(soRec, linesToProcess) {
function scg_ra_updateRevenueArrangementId(soRec) {
	nlapiLogExecution('DEBUG', 'updateREvenueArrangementId Function', 'Running');
	// Initialize variables
	var revArrRec = scg_ra_getRevenueArrangement(soRec);
	var isModified = false;
	
	if (revArrRec){
		//Get End User, Partner/JV/Reseller, and Distributor values from transaction record
		var enduser = soRec.getFieldValue('custbody_so_enduser');
		var partner = soRec.getFieldValue('custbody_partnerjvreseller');
		var distributor = soRec.getFieldValue('custbody_distributor');
		nlapiLogExecution('DEBUG', 'End User = ' + enduser, 'Partner = ' + partner);
		nlapiLogExecution('DEBUG', 'Distributor', distributor);
		
		//Write Vales to Revenue Arrangement Record
		revArrRec.setFieldValue('custbody_so_enduser', enduser);
		revArrRec.setFieldValue('custbody_partnerjvreseller', partner);
		revArrRec.setFieldValue('custbody_distributor', distributor);
		isModified = true;
		
	}
	
	// Set the rev rec dates on the revenue element lines
	//for (var i=0; revArrRec && linesToProcess != null && i < linesToProcess.length; i++) {
		//var lineNumber = revArrRec.findLineItemValue('revenueelement', 'sourceid', linesToProcess[i]['souniquelineid']);
		//nlapiLogExecution('DEBUG', 'Line Number', lineNumber);
		//if (lineNumber > 0) {
			
			//var existingStartDate = revArrRec.getLineItemValue('revenueelement', 'revrecstartdate', lineNumber);
			//var existingEndDate = revArrRec.getLineItemValue('revenueelement', 'revrecenddate', lineNumber);
			//if(!IsNullOrEmpty(existingStartDate) || !IsNullOrEmpty(existingEndDate)){
				//revArrRec.setLineItemValue('revenueelement', 'custcol_revenue_dates_updated', lineNumber, 'T');				
			//}
			
			
			//revArrRec.setLineItemValue('revenueelement', 'revrecstartdate', lineNumber, linesToProcess[i]['revrecstart']);
			//revArrRec.setLineItemValue('revenueelement', 'revrecenddate', lineNumber, linesToProcess[i]['revrecend']);
			//revArrRec.setLineItemValue('revenueelement', 'forecaststartdate', lineNumber, linesToProcess[i]['revrecstart']);
			//revArrRec.setLineItemValue('revenueelement', 'forecastenddate', lineNumber, linesToProcess[i]['revrecend']);
			//isModified = true;
		//}
	//}
	
	
	// Commit the changes to the revenue arrangement process
	if (isModified) {
		nlapiSubmitRecord(revArrRec);
	}
}


/**
 * Returns the revenue arrangement associated with a transaction
 *
 * @appliedtorecord salesorder
 * @appliedtorecord cashsale
 * @appliedtorecord invoice
 * @appliedtorecord creditmemo
 *
 * @param {nlobjRecord} soRec the Sales Order record
 * 
 * @returns {nlobjRecord}
 */
function scg_ra_getRevenueArrangement(soRec) {
	// Initialize variables
	var revArrRecId = null;
	var revArrRec = null;
	
	var recType = soRec.getRecordType();
	
	// Loop through the sales order's list of related records
	var itemCount = recType != 'invoice' ? soRec.getLineItemCount('links') : soRec.getLineItemCount('arrngrlrcds');
	
	nlapiLogExecution('DEBUG', 'itemCount', itemCount);
	
	for (var i=1; !revArrRecId && itemCount != 0 && i <= itemCount; i++) {
		if(recType != 'invoice'){
			var linkUrl = soRec.getLineItemValue('links', 'linkurl', i);
			if (linkUrl && linkUrl.indexOf('revarrng') > 0) {
				revArrRecId = soRec.getLineItemValue('links', 'id', i);
			}
		} else {
			revArrRecId = soRec.getLineItemValue('arrngrlrcds', 'appldatekey', i);
		}
	}
	
	// Get the revenue arrangement object
	revArrRec = (revArrRecId) ? nlapiLoadRecord('revenuearrangement', revArrRecId) : null;
	
	
	nlapiLogExecution('DEBUG', 'revArrRec', revArrRecId);

	
	// Return record
	return revArrRec;
}

function IsNullOrEmpty(testObj){
	
	if(testObj != null && testObj != "" && testObj != undefined){
		return false;
	}else{
		return true;
	}
}