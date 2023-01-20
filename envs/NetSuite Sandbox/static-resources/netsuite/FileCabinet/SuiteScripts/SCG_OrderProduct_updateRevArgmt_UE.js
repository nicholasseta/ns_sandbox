/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Jan 2022     Doug Humberd     Copies 'Rev Rec Dates' and 'End User' changes from Order Products to Revenue Arrangement
 * 1.01       21 Jan 2022     Doug Humberd     Updated to not run if Revenue Element is empty
 * 1.02       10 Jan 2023     Doug Humberd     Updated to include 'SF Deal ID' changes
 *
 */


/**
 * Copies 'Rev Rec Dates' and 'End User' from Order Product to Revenue Arrangement
 *
 * @appliedtorecord customrecord_contractlines
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function scg_op_ra_updateRevArgmt(type) {
	// Only run on edit
	if (type != 'edit')
		return;
	
	// Initialize variables
	var oldOpRec = nlapiGetOldRecord();
	var newOpRec = nlapiGetNewRecord();
	
	//Only run if Revenue Element is not empty
	var revenueElementId = newOpRec.getFieldValue('custrecord_is_cl_revenue_element');
	nlapiLogExecution('DEBUG', 'Revenue Element ID', revenueElementId);
	
	if (IsNullOrEmpty(revenueElementId)){
		nlapiLogExecution('DEBUG', 'Revenue Element EMPTY', 'EXIT');
		return;
	}
	
	var revRecStart = newOpRec.getFieldValue('custrecord_is_revrec_startdate');
	var revRecEnd = newOpRec.getFieldValue('custrecord_is_revrec_enddate');
	var enduser = newOpRec.getFieldValue('custrecord_op_end_user');
	var sfDealId = newOpRec.getFieldValue('custrecord_is_cl_sf_deal_id');
	//var partner = newOpRec.getFieldValue('custbody_partnerjvreseller');
	//var distributor = newOpRec.getFieldValue('custbody_distributor');
	//var trigger = newOpRec.getFieldValue('custbody_trigger_script_wf');//This field is used to trigger the script to update pre-existing records
	
	//var isChanged = (oldOpRec) ? scg_op_ra_compareFields(oldOpRec, enduser, partner, distributor, trigger) : (type == 'create') ? true : false;
	var isChanged = (oldOpRec) ? scg_op_ra_compareFields(oldOpRec, revRecStart, revRecEnd, enduser, sfDealId) : (type == 'create') ? true : false;
	
	nlapiLogExecution('DEBUG', 'isChanged', isChanged);
	
	if (isChanged){
		nlapiLogExecution('DEBUG', 'Order Product Changed', 'Update Revenue Arrangement');
		// Update the Revenue Arrangement
		//scg_op_ra_updateRevenueArrangementId(newOpRec, linesToProcess);
		scg_op_ra_updateRevenueArrangementId(newOpRec);
	}
	
	// Look for lines with new/changed Rev Rec dates
	//var linesToProcess = [];
	//var itemCount = newOpRec.getLineItemCount('item');
	//for (var i=1; itemCount != 0 && i <= itemCount; i++) {
		//var revRecStart = newOpRec.getLineItemValue('item', 'custcol_rev_rec_start_date', i);
		//var revRecEnd = newOpRec.getLineItemValue('item', 'custcol_rev_rec_end_date', i);
		//var uniqueLineId = newOpRec.getLineItemValue('item', 'lineuniquekey', i);
		//var isChanged = (oldOpRec) ? scg_ra_compareDates(oldOpRec, uniqueLineId, revRecStart, revRecEnd) : (type == 'create') ? true : false;

		
		//if (isChanged) {
            //linesToProcess.push({'solinenum': i, 'souniquelineid': uniqueLineId, 'revrecstart': revRecStart, 'revrecend': revRecEnd});
		//}
	//}
	
	//nlapiLogExecution('DEBUG', 'linesToProcess.length', linesToProcess.length);
	
	// Update the Revenue Arrangement
	//if (linesToProcess && linesToProcess.length > 0) {
		//scg_op_ra_updateRevenueArrangementId(newOpRec, linesToProcess);
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
 * @param {nlobjRecord} oldOpRec the version of the Transaction record prior to editing
 * @param {Integer} uniqueLineId the line whose rev rec dates are being compared
 * @param {String} revRecStart the rev rec start date
 * @param {String} revRecEnd the rev rec end date
 * 
 * @returns {Boolean}
 */
function scg_op_ra_compareFields(oldOpRec, revRecStart, revRecEnd, enduser, sfDealId) {
	nlapiLogExecution('DEBUG', 'compareDates Function', 'Running');
	// Initialize variables
	var isChanged = true;
	nlapiLogExecution('DEBUG', 'enduser', enduser);
	nlapiLogExecution('DEBUG', 'sfDealId', sfDealId);
	nlapiLogExecution('DEBUG', 'revRecStart', revRecStart);
	nlapiLogExecution('DEBUG', 'revRecEnd', revRecEnd);
	
	var oldEnduser = oldOpRec.getFieldValue('custrecord_op_end_user');
	var oldSFdealID = oldOpRec.getFieldValue('custrecord_is_cl_sf_deal_id');
	var oldRevRecStart = oldOpRec.getFieldValue('custrecord_is_revrec_startdate');
	var oldRevRecEnd = oldOpRec.getFieldValue('custrecord_is_revrec_enddate');
	//var oldTrigger = oldOpRec.getFieldValue('custbody_trigger_script_wf');
	
	nlapiLogExecution('DEBUG', 'old enduser', oldEnduser);
	nlapiLogExecution('DEBUG', 'old SFdealID', oldSFdealID);
	nlapiLogExecution('DEBUG', 'old revRecStart', oldRevRecStart);
	nlapiLogExecution('DEBUG', 'old revRecEnd', oldRevRecEnd);
	
	if (oldEnduser == enduser && oldRevRecStart == revRecStart && oldRevRecEnd == revRecEnd && oldSFdealID == sfDealId){
		isChanged = false;
	}
	
	// Compare the rev rec dates
	//var lineNumber = nlapiFindLineItemValue('item', 'lineuniquekey', uniqueLineId);
	//nlapiLogExecution('DEBUG', 'Line Unique Key', lineNumber);
	//if (lineNumber > 0) {
		//var oldRevRecStart = oldOpRec.getLineItemValue('item', 'custcol_rev_rec_start_date', lineNumber);
		//var oldRevRecEnd = oldOpRec.getLineItemValue('item', 'custcol_rev_rec_end_date', lineNumber);
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
//function scg_op_ra_updateRevenueArrangementId(soRec, linesToProcess) {
function scg_op_ra_updateRevenueArrangementId(newOpRec) {
	nlapiLogExecution('DEBUG', 'updateREvenueArrangementId Function', 'Running');
	// Initialize variables
	var revElmtId = newOpRec.getFieldValue('custrecord_is_cl_revenue_element');
	nlapiLogExecution('DEBUG', 'Revenue Element ID', revElmtId);
	
	var revArrRec = scg_ra_getRevenueArrangement(revElmtId);
	var isModified = false;
	
	//return;//TEMP CODE
	//nlapiLogExecution('DEBUG', 'After Return', 'AFTER');
	
	if (revArrRec){
		//Get End User, Rev Rec Start Date, and Rev Rec End Date values from order product record
		var op_enduser = newOpRec.getFieldText('custrecord_op_end_user');
		var op_sfdealid = newOpRec.getFieldValue('custrecord_is_cl_sf_deal_id');
		var op_rrstart = newOpRec.getFieldValue('custrecord_is_revrec_startdate');
		var op_rrend = newOpRec.getFieldValue('custrecord_is_revrec_enddate');
		nlapiLogExecution('DEBUG', 'OP End User', op_enduser);
		nlapiLogExecution('DEBUG', 'OP SF Deal ID', op_sfdealid);
		nlapiLogExecution('DEBUG', 'OP Rev Rec Start = ' + op_rrstart, 'OP Rev Rec End = ' + op_rrend);
		
		//Write Vales to Revenue Arrangement Record
		
		/*
		revArrRec.setFieldValue('custbody_so_enduser', enduser);
		revArrRec.setFieldValue('custbody_partnerjvreseller', partner);
		revArrRec.setFieldValue('custbody_distributor', distributor);
		isModified = true;
		*/
		
		var raLines = revArrRec.getLineItemCount('revenueelement');
		nlapiLogExecution('DEBUG', 'Revenue Arrangement Lines', raLines);
		
		for (var i=1; revArrRec && i <= raLines; i++){
			
			var ra_Elmt = revArrRec.getLineItemValue('revenueelement', 'revenueelement', i);
			nlapiLogExecution('DEBUG', 'Rev Argmt Element Line ' + i, ra_Elmt);
			
			if (ra_Elmt == revElmtId){
				
				revArrRec.setLineItemValue('revenueelement', 'revrecstartdate', i, op_rrstart);
				revArrRec.setLineItemValue('revenueelement', 'revrecenddate', i, op_rrend);
				revArrRec.setLineItemValue('revenueelement', 'forecaststartdate', i, op_rrstart);
				revArrRec.setLineItemValue('revenueelement', 'forecastenddate', i, op_rrend);
				revArrRec.setLineItemValue('revenueelement', 'custcol_end_user_customer_line', i, op_enduser);
				revArrRec.setLineItemValue('revenueelement', 'custcol_sf_deal_id_ra', i, op_sfdealid);
				isModified = true;
				
				break;
				
			}
			
		}//End for i loop
		
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
function scg_ra_getRevenueArrangement(revElmtId) {
	// Initialize variables
	var revArrRecId = null;
	var revArrRec = null;
	
	//var revElmtId = newOpRec.getFieldValue('custrecord_is_cl_revenue_element');
	//nlapiLogExecution('DEBUG', 'Revenue Element ID', revElmtId);
	
	var searchresults = getRevArgmtId(revElmtId);
	
	if (searchresults){
		nlapiLogExecution('DEBUG', 'Rev Argmt FOUND', 'RA FOUND');
		var revArrRecId = searchresults[0].getValue('internalid');
		nlapiLogExecution('DEBUG', 'Revenue Arrangement ID', revArrRecId);
	}else{
		nlapiLogExecution('DEBUG', 'Rev Argmt NOT FOUND', 'NO RESULTS');
	}
	
	
	/*
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
	*/
	
	
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


function getRevArgmtId(revElmtId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', 'revenueelement', 'anyof', revElmtId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));
	
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('revenuearrangement', null, filters, columns);
	  
	// Return
	return results;
	
}