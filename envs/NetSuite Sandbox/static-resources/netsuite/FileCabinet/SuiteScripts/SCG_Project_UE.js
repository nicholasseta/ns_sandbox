/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Sep 2018     Doug Humberd     Handles user events on Project records
 * 1.10       06 Sep 2018     Doug Humberd     Updated is_pr_setOpenAirProjTemplate to write 'Amount', 'Quantity', 'ERP', and 'Product Line' values from SO
 * 1.20       20 Sep 2018     Doug Humberd     Changed 'amount' fields to be 'fxamount'
 * 1.25       08 Nov 2018     Doug Humberd     Added code to check if search returns a SO before processing.  If no results, Exit.
 * 1.26       19 Jun 2019     Greg DelVecchio  Updated with 'End User' values
 * 1.27       08 Aug 2019     Doug Humberd     Updated with "ERP Version" values
 * 1.28       25 Oct 2019     Doug Humberd     Updated with "Product Family" values
 * 1.29       06 Dec 2019     Doug Humberd     Updated with "Delivery Type" values
 * 1.30       27 Mar 2020     Doug Humberd     Updated with Additional fields (per Vicky Marquez email 3-27-20)
 * 1.31       16 Apr 2020     Vicky Marquez    Updated with "Business Line"
 * 1.32       14 May 2020     Doug Humberd     Updated with "Billing Type"
 * 1.33       20 May 2020     Doug Humberd     Updated with "PO#"
 * 1.34       28 Jul 2020     Doug Humberd     Updated with "OpenAir: Rev Rec Rule" (copied to OpenAir Revenue Rule)
 * 1.40       10 Sep 2020     Doug Humberd     Added 'is_pr_setPctCompOvrTo100' to set Percent Complete Override on all lines to 100% when a new line is added
 * 1.41       04 Jan 2021     Matt Poloni      Updated with "Term Start Date" and "Term End Date"
 * 1.42       06 Jan 2021     Matt Poloni      Updated with "Rev Rec Start Date" and "Rev Rec End Date"
 * 1.43		  11 Jan 2021	  Vicky Marquez	   Updated with "OA Business Line"
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord job
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_pr_beforeLoad(type, form, request) {
	try {
		//is_pr_beforeLoadFunction(type, form, request);
	} catch (e) {
		is_pr_logError(e);
		throw e;
	}
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord job
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_pr_beforeSubmit(type) {
	nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
	try {
		//is_pr_beforeSubmitFunction(type);
	} catch (e) {
		is_pr_logError(e);
		throw e;
	}
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord job
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_pr_afterSubmit(type) {
	nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
	try {
		is_pr_setOpenAirProjTemplate(type);
		is_pr_setPctCompOvrTo100(type);
	} catch (e) {
		is_pr_logError(e);
		throw e;
	}
}


/**
 * Writes an error message to the Script Execution Log
 *
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 *
 * @returns {Void}
 */
function is_pr_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}





/**
 * Sets the value of the Open Air Project Template and sets the Export to OpenAir checkbox
 *
 * @appliedtorecord job
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_pr_setOpenAirProjTemplate(type) {

	//Run on Create
	//if (type != 'create' && type != 'edit'){
	if (type != 'create') {
		return;
	}

	var projId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'Project ID', projId);

	var searchresults = is_pr_getSalesOrder(projId);

	//Only continue if the Search Returns a SO
	if (!searchresults) {
		nlapiLogExecution('DEBUG', 'No Associated SO Found', 'Exit Code');
		return;
	}

	var soId = (searchresults) ? searchresults[0].getId() : null;
	//var soLineNum = (searchresults) ? searchresults[0].getValue('linesequencenumber') : null;
	//var soLineUniqueId = (searchresults) ? searchresults[0].getValue('lineuniquekey') : null;
	var soLineItem = (searchresults) ? searchresults[0].getValue('item') : null;
	var amt = (searchresults) ? searchresults[0].getValue('fxamount') : null;
	var qty = (searchresults) ? searchresults[0].getValue('quantity') : null;
	var erp = (searchresults) ? searchresults[0].getValue('class') : null;
	//var prodLine = (searchresults) ? searchresults[0].getValue('custcol_cseg_prod_line') : null;
	var sfOppId = (searchresults) ? searchresults[0].getValue('custbody_sf_opportunity_id') : null;
	var soCurrency = (searchresults) ? searchresults[0].getValue('currency') : null;
	var salesGeo = (searchresults) ? searchresults[0].getValue('custbody_sales_geo') : null;
	var oppCloseDate = (searchresults) ? searchresults[0].getValue('custbody_oppty_close_date') : null;
	var location = (searchresults) ? searchresults[0].getValue('location') : null;
	var serviceType = (searchresults) ? searchresults[0].getValue('custcol_service_type') : null;
	var endUser = (searchresults) ? searchresults[0].getValue('custbody_so_enduser') : null;
	var erpVersion = (searchresults) ? searchresults[0].getValue('custcol_erp_version') : null;
	var prodFamily = (searchresults) ? searchresults[0].getValue('custcol_product_family') : null;
	var delType = (searchresults) ? searchresults[0].getValue('custcol_delivery_type') : null;
	var svcsContact = (searchresults) ? searchresults[0].getValue('custbody_services_contact') : null;
	var billSched = (searchresults) ? searchresults[0].getValue('billingschedule') : null;
	var satisfClause = (searchresults) ? searchresults[0].getValue('custcol_satisfaction_clause_required') : null;
	var busLine = (searchresults) ? searchresults[0].getValue('custcol_so_business_line') : null;
	var billingType = (searchresults) ? searchresults[0].getValue('custcol_billing_type') : null;
	var poNumber = (searchresults) ? searchresults[0].getValue('otherrefnum') : null;
	var oaRevRecRule = (searchresults) ? searchresults[0].getValue('custcol_oa_rev_rec_rule') : null;
	var termStartDate = (searchresults) ? searchresults[0].getValue('custcol_term_start_date') : null;
	var termEndDate = (searchresults) ? searchresults[0].getValue('custcol_term_end_date') : null;
	var revRecStartDate = (searchresults) ? searchresults[0].getValue('custcol_rev_rec_start_date') : null;
	var revRecEndDate = (searchresults) ? searchresults[0].getValue('custcol_rev_rec_end_date') : null;
    var oaBusLine = (searchresults) ? searchresults[0].getValue('custcol_oa_business_line') : null;


	var shipAttn = (searchresults) ? searchresults[0].getValue('shippingattention') : null;
	var shipAddressee = (searchresults) ? searchresults[0].getValue('shipaddressee') : null;
	var shipPhone = (searchresults) ? searchresults[0].getValue('shipphone') : null;
	var shipAddr1 = (searchresults) ? searchresults[0].getValue('shipaddress1') : null;
	var shipAddr2 = (searchresults) ? searchresults[0].getValue('shipaddress2') : null;
	var shipCity = (searchresults) ? searchresults[0].getValue('shipcity') : null;
	var shipState = (searchresults) ? searchresults[0].getValue('shipstate') : null;
	var shipZip = (searchresults) ? searchresults[0].getValue('shipzip') : null;
	var shipCountry = (searchresults) ? searchresults[0].getValue('shipcountry') : null;


	nlapiLogExecution('DEBUG', 'SO ID', soId);
	//nlapiLogExecution('DEBUG', 'SO Line Num', soLineNum);
	//nlapiLogExecution('DEBUG', 'SO Line Unique ID', soLineUniqueId);
	nlapiLogExecution('DEBUG', 'SO Line Item', soLineItem);
	nlapiLogExecution('DEBUG', 'Amount', amt);
	nlapiLogExecution('DEBUG', 'Quantity', qty);
	nlapiLogExecution('DEBUG', 'ERP', erp);
	//nlapiLogExecution('DEBUG', 'Product Line', prodLine);
	nlapiLogExecution('DEBUG', 'SF Opportunity ID', sfOppId);
	nlapiLogExecution('DEBUG', 'SO Currency', soCurrency);
	nlapiLogExecution('DEBUG', 'Sales Geo', salesGeo);
	nlapiLogExecution('DEBUG', 'Opportunity Close Date', oppCloseDate);
	nlapiLogExecution('DEBUG', 'SO End User', endUser);
	nlapiLogExecution('DEBUG', 'SO ERP Version', erpVersion);
	nlapiLogExecution('DEBUG', 'SO Product Family', prodFamily);
	nlapiLogExecution('DEBUG', 'SO Delivery Type', delType);
	nlapiLogExecution('DEBUG', 'Services Contact', svcsContact);
	nlapiLogExecution('DEBUG', 'Billing Sched', billSched);
	nlapiLogExecution('DEBUG', 'Satisfaction Clause Req', satisfClause);
	nlapiLogExecution('DEBUG', 'SO Business Line', busLine);
	nlapiLogExecution('DEBUG', 'Billing Type', billingType);
	nlapiLogExecution('DEBUG', 'PO Number', poNumber);
	nlapiLogExecution('DEBUG', 'OpenAir Rev Rec Rule', oaRevRecRule);
	nlapiLogExecution('DEBUG', 'Term Start Date', termStartDate);
	nlapiLogExecution('DEBUG', 'Term End Date', termEndDate);
	nlapiLogExecution('DEBUG', 'Rev Rec Start Date', revRecStartDate);
	nlapiLogExecution('DEBUG', 'Rev Rec End Date', revRecEndDate);
    nlapiLogExecution('DEBUG', 'OA Business Line', oaBusLine);
	nlapiLogExecution('DEBUG', 'Ship Attn', shipAttn);
	nlapiLogExecution('DEBUG', 'Ship Addressee', shipAddressee);
	nlapiLogExecution('DEBUG', 'Ship Phone', shipPhone);
	nlapiLogExecution('DEBUG', 'Ship Addr1', shipAddr1);
	nlapiLogExecution('DEBUG', 'Ship Addr2', shipAddr2);
	nlapiLogExecution('DEBUG', 'Ship City', shipCity);
	nlapiLogExecution('DEBUG', 'Ship State', shipState);
	nlapiLogExecution('DEBUG', 'Ship Zip', shipZip);
	nlapiLogExecution('DEBUG', 'Ship Country', shipCountry);

	var projTemplate = nlapiLookupField('item', soLineItem, 'custitem_oa_proj_temp');
	nlapiLogExecution('DEBUG', 'Project Template', projTemplate);

	//Set the Template Value on the Project Record, and check off the Export to OpenAir checkbox
	nlapiSubmitField('job', projId, ['custentity_oa_project_template', 'custentity_oa_export_to_openair'], [projTemplate, 'T']);

	//Set Body Fields on Project Record
	nlapiSubmitField('job', projId, ['custentity_so_amount', 'custentity_so_quantity', 'custentity_so_erp', 'custentity_sf_opportunity_id_project', 'custentity_so_currency', 'custentity_sales_geo', 'custentity_oppty_close_date', 'custentity_so_product_line', 'custentity_serv_type', 'custentity_so_end_user_customer', 'custentity_so_erp_version', 'custentity_so_product_family', 'custentity_delivery_type', 'custentity_services_contact', 'custentity_so_billing_schedule', 'custentity_satisfaction_clause_required', 'custentity_so_business_line', 'custentity_so_ship_attn', 'custentity_so_ship_addressee', 'custentity_so_ship_phone', 'custentity_so_ship_addr1', 'custentity_so_ship_addr2', 'custentity_so_ship_city', 'custentity_so_ship_state', 'custentity_so_ship_zip', 'custentity_so_ship_country', 'custentity_so_billing_type', 'custentity_so_po_number', 'custentity_oa_rev_rec_rule', 'custentity_term_start_date', 'custentity_term_end_date', 'custentity_rev_rec_start_date', 'custentity_rev_rec_end_date', 'custentity_oa_business_line'], [amt, qty, erp, sfOppId, soCurrency, salesGeo, oppCloseDate, location, serviceType, endUser, erpVersion, prodFamily, delType, svcsContact, billSched, satisfClause, busLine, shipAttn, shipAddressee, shipPhone, shipAddr1, shipAddr2, shipCity, shipState, shipZip, shipCountry, billingType, poNumber, oaRevRecRule, termStartDate, termEndDate, revRecStartDate, revRecEndDate, oaBusLine]);


}



/**
 * Returns a list of sales orders tied to a project
 *
 * @appliedtorecord salesorder
 *
 * @param {Integer} projectId The internal id of the project record
 *
 * @returns {nlobjSearchResults}
 */
function is_pr_getSalesOrder(projectId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalidnumber', 'job', 'equalto', projectId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('type', null, null));
	columns.push(new nlobjSearchColumn('trandate', null, null));
	//columns.push(new nlobjSearchColumn('linesequencenumber', null, null));
	//columns.push(new nlobjSearchColumn('lineuniquekey', null, null));
	columns.push(new nlobjSearchColumn('item', null, null));
	columns.push(new nlobjSearchColumn('class', null, null));
	columns.push(new nlobjSearchColumn('fxamount', null, null));
	columns.push(new nlobjSearchColumn('quantity', null, null));
	//columns.push(new nlobjSearchColumn('custcol_cseg_prod_line', null, null));
	columns.push(new nlobjSearchColumn('custbody_sf_opportunity_id', null, null));
	columns.push(new nlobjSearchColumn('currency', null, null));
	columns.push(new nlobjSearchColumn('custbody_sales_geo', null, null));
	columns.push(new nlobjSearchColumn('custbody_oppty_close_date', null, null));
	columns.push(new nlobjSearchColumn('location', null, null));
	columns.push(new nlobjSearchColumn('custcol_service_type', null, null));
	columns.push(new nlobjSearchColumn('custbody_so_enduser', null, null));
	columns.push(new nlobjSearchColumn('custcol_erp_version', null, null));
	columns.push(new nlobjSearchColumn('custcol_product_family', null, null));
	columns.push(new nlobjSearchColumn('custcol_delivery_type', null, null));
	columns.push(new nlobjSearchColumn('custbody_services_contact', null, null));
	columns.push(new nlobjSearchColumn('billingschedule', null, null));
	columns.push(new nlobjSearchColumn('custcol_satisfaction_clause_required', null, null));
	columns.push(new nlobjSearchColumn('custcol_so_business_line', null, null));
	columns.push(new nlobjSearchColumn('custcol_billing_type', null, null));
	columns.push(new nlobjSearchColumn('otherrefnum', null, null));
	columns.push(new nlobjSearchColumn('custcol_oa_rev_rec_rule', null, null));
	columns.push(new nlobjSearchColumn('custcol_term_start_date', null, null));
	columns.push(new nlobjSearchColumn('custcol_term_end_date', null, null));
	columns.push(new nlobjSearchColumn('custcol_rev_rec_start_date', null, null));
	columns.push(new nlobjSearchColumn('custcol_rev_rec_end_date', null, null));
    columns.push(new nlobjSearchColumn('custcol_oa_business_line', null, null));
	//Shipping Address Fields
	columns.push(new nlobjSearchColumn('shippingattention', null, null));
	columns.push(new nlobjSearchColumn('shipaddressee', null, null));
	columns.push(new nlobjSearchColumn('shipphone', null, null));
	columns.push(new nlobjSearchColumn('shipaddress1', null, null));
	columns.push(new nlobjSearchColumn('shipaddress2', null, null));
	columns.push(new nlobjSearchColumn('shipcity', null, null));
	columns.push(new nlobjSearchColumn('shipstate', null, null));
	columns.push(new nlobjSearchColumn('shipzip', null, null));
	columns.push(new nlobjSearchColumn('shipcountry', null, null));
    // New project fields should first be added in SCG_SalesOrder_UE.js

	columns[0].setSort(true /* descending */);

	// Run search for Sales Order
	var results = nlapiSearchRecord('salesorder', null, filters, columns);
	//if (results && results.length > 0)
	return results;
	// If Sales Order not found, run search for Cash Sale
	//return nlapiSearchRecord('cashsale', null, filters, columns);
}






function is_pr_setPctCompOvrTo100(type) {

	if (type == 'delete') {
		return;
	}

	nlapiLogExecution('DEBUG', 'setPctCompOvrTo100', 'START');

	var projId = nlapiGetRecordId();
	var projRec = nlapiGetNewRecord();

	var setTo100 = projRec.getFieldValue('custentity_scg_set_revrec_to_100pct');
	nlapiLogExecution('DEBUG', 'Set Rev Rec to 100%', setTo100);

	if (setTo100 == 'T') {

		var projRecord = nlapiLoadRecord('job', projId);

		var lineCount = projRecord.getLineItemCount('percentcompleteoverride');
		nlapiLogExecution('DEBUG', 'Percent Complete Override Line Count', lineCount);

		for (var i = 1; i <= lineCount; i++) {

			var percent = projRecord.getLineItemValue('percentcompleteoverride', 'percent', i);

			if (percent != '100.0%') {
				nlapiLogExecution('DEBUG', 'Percent Found: ' + percent, 'Set Percent to 100');
				projRecord.setLineItemValue('percentcompleteoverride', 'percent', i, '100');
			}

		}//End for i loop

		nlapiSubmitRecord(projRecord);

	}

	nlapiLogExecution('DEBUG', 'setPctCompOvrTo100', 'END');

}



