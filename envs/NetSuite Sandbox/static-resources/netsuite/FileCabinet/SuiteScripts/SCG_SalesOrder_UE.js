/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       17 Aug 2018     Doug Humberd     Handles user events on Sales Order records
 * 	          24 Sep 2018     Doug Humberd     Added beforeSubmit script to set OA Rate field on the line level so that OpenAir can pull the value without it being converted by Exch Rate
 * 1.10       28 Sep 2018     Doug Humberd     Added functionality to pull multiple email addresses from customer record 
 * 1.20       01 Oct 2018     Doug Humberd     Added functionality to set Term Start Date and Term End Date fields on SO create
 * 1.30       26 Nov 2018     Doug Humberd     Added function is_so_closeZeroDollarOrders to close Sales Orders if Total = $0 when they are approved
 * 1.35       27 Nov 2018     Doug Humberd     Updated function is_so_closeZeroDollarOrders to also run on Edit (Not just on Approve)
 * 1.40       05 Dec 2018     Doug Humberd     Commented out afterSubmit function "scg_ra_updateRevenueArrangement" - moved to alternate script "SCG_UpdateRevenueArrangement_UE" so can employ multiple deployments
 * 1.50       04 Mar 2019     Doug Humberd     Removed "is_so_setTermStartEndDates" - moved to a stand-alone script so that it can be deployed to multiple transaction records
 * 1.60       28 May 2019     Doug Humberd     Added "is_so_addFastSpringFee" to add line item for "FastSpring Fee"
 * 1.70       10 Jun 2019     Doug Humberd     Updated "is_so_addFastSpringFee" to no longer perform a subsidary check for Biznet
 * 1.80       09 Aug 2019     Doug Humberd     Added "is_so_updMonth2MonthContractFields" to update Billing Start Date and Billing Schedule values if Month to Month Contract is Checked on create
 * 1.85       15 Aug 2019     Doug Humberd     Added "is_so_addMonth2MonthButton" to add a button to manually run Month to Month Contract code
 * 1.86       09 Dec 2019     Doug Humberd     COMMENT OUT "is_so_addMonth2MonthButton" per John - - Never made it to Sandbox.  Unlikely it is being used
 * 1.90       09 Dec 2019     Doug Humberd     Updated 'is_so_updMonth2MonthContractFields' to not update billing schedule if item = Jet Reports Subscription Initialization (4454)
 * 
 * 2.00       11 May 2020     Doug Humberd     Added 'is_so_createProjects' to create and set new / set existing projects on line level when SO is approved
 * 2.05       20 May 2020     Doug Humberd     Updated 'is_so_createProjects' with 'Created by Script' field, and also PO# mapped
 * 2.06       11 Jun 2020     Doug Humberd     Updated 'is_so_createProjects' to remove 'create project by script' check when setting existing project on line
 * 2.07       28 Jul 2020     Doug Humberd     Updated 'is_so_createProjects' to include "OpenAir: Rev Rec Rule" (copied to OpenAir Revenue Rule)
 * 2.10       14 Oct 2020     Doug Humberd     Updated 'is_so_setToBeEmailedValue' to include the "Invoice Contact" email
 * 2.11       03 Nov 2020     Doug Humberd     Updated 'is_so_setToBeEmailedValue' to check if Customer is a Partner.  If Partner, do not use Invoice Contact
 * 2.12       04 Jan 2021     Matt Poloni      Updated 'is_so_createProjects' to include "Term Start Date" and "Term End Date"/**
 * 2.13       06 Jan 2021     Matt Poloni      Updated 'is_so_createProjects' to include "Rev Rec Start Date" and "Rev Rec End Date"
 * 2.14       14 Jan 2021     Matt Poloni      Updated 'is_so_createProjects' to include "OA Business Line"
 * 
 * 2.20       07 Apr 2021     Doug Humberd     Updated 'is_so_createProjects' to reset the Billing Schedule value on the SO after the Project is written to the line
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const FASTSPRING_FEE = '2765';//2765 = Fastspring Fee
const BIZNET_SUB = '67';//67 = BizNet Software, Inc.
const MONTHLY_12 = '7';//7 = Monthly 12, Billed Monthly in Advance
const JET_RPTS_SUBS_INIT = '4454';//4454 = Jet Reports Subscription Initialization


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_so_beforeLoad(type, form, request) {
    try {
        is_so_setClientScript(type, form, request);
        is_so_addCommLinesButton(type, form, request);
        //is_so_addMonth2MonthButton(type, form, request);//COMMENT OUT PER JOHN
    } catch (e) {
        is_so_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_so_3rdPartyCommissions(type);
        //is_so_setProductLineSegment(type); MOVED TO afterSubmit
        is_so_setOARate(type);
        is_so_addFastSpringFee(type);
        is_so_updMonth2MonthContractFields(type);

        is_so_createProjects(type);
    } catch (e) {
        is_so_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //scg_ra_updateRevenueArrangement(type);
        is_so_setToBeEmailedValue(type);
        //is_so_setProductLineSegment(type);//MOVED FROM beforeSubmit - Shut off per John.  Insight changed the Boomi mapping from Product Line Prep to the standart Location field.  This script is no longer needed.
        is_so_closeZeroDollarOrders(type);
        //is_so_createProjects(type);
    } catch (e) {
        is_so_logError(e);
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
function is_so_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}


/**
 * Adds 3rd Party Commission line items to the order on create if the item has a Commission Rate value
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */

function is_so_3rdPartyCommissions(type) {

    //Only run on create
    if (type != 'create') {
        return;
    }


    //Run code to add 3rd party commission items, where applicable
    scg_so_set3rdPartyCommissionLines();

}



/**
 * Sets the client script to be used by this form
 * 
 * @appliedtorecord salesorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_so_setClientScript(type, form, request) {
    form.setScript('customscript_scg_salesorder_cs');
}


/**
 * Handles click events on the Add Commission Lines button
 * 
 * @appliedtorecord salesorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_so_addCommLinesButton(type, form, request) {

    if (type == 'edit') {

        nlapiLogExecution('DEBUG', 'addCommLinesButton run', 'Add Commission Lines Button Added');

        form.addButton('custpage_add_comm_lines_button', 'Add Commission Lines', 'is_so_3rdPartyCommissions()');

    }
}




/**
 * Adds the button for click events on the Make Month to Month Contract Updates button
 * 
 * @appliedtorecord salesorder
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_so_addMonth2MonthButton(type, form, request) {

    if (type == 'edit') {

        nlapiLogExecution('DEBUG', 'addMonth2MonthButton run', 'Add Monthly Billing Button Added');

        form.addButton('custpage_add_month_to_month_button', 'Add Monthly Billing and Save', 'is_so_makeMonth2MonthUpdates()');

    }

}




/**
 * Setsthe Product Line Custom Segment column on each line
 * 
 * @appliedtorecord salesorder
 *   
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */

function is_so_setProductLineSegment(type) {
    // Only run on create
    if (type != 'create')
        return;

    var soRec = nlapiGetNewRecord();
    var lineCount = soRec.getLineItemCount('item');
    nlapiLogExecution('DEBUG', 'LineCount', lineCount);

    var soId = soRec.getId();
    var sOrderRec = nlapiLoadRecord('salesorder', soId);

    for (var i = 1; lineCount > 0 && i <= lineCount; i++) {
        sOrderRec.selectLineItem('item', i);
        var productLine = sOrderRec.getCurrentLineItemValue('item', 'custcol_product_line_prep');
        sOrderRec.setCurrentLineItemValue('item', 'custcol_cseg_prod_line', productLine);
        sOrderRec.commitLineItem('item');
        nlapiLogExecution('DEBUG', 'ProductLinePrep/ProductLine', productLine + '/' + sOrderRec.getCurrentLineItemValue('item', 'custcol_cseg_prod_line'));
    }

    nlapiSubmitRecord(sOrderRec);

}


/**
 * Sets the OA Rate field on the line items = the value in the Rate column on the Sales Order.
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_setOARate(type) {

    var itemCount = nlapiGetLineItemCount('item');

    for (var i = 1; itemCount > 0 && i <= itemCount; i++) {

        var rate = nlapiGetLineItemValue('item', 'rate', i);
        nlapiLogExecution('DEBUG', 'Rate on Line Item', rate);
        nlapiSetLineItemValue('item', 'custcol_scg_oa_rate', i, rate);

    }



}




/**
 * Sets the email field with the Multiple Invoice Email value pulled from the customer record
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_setToBeEmailedValue(type) {

    //Only Run on Create
    if (type != 'create') {
        return;
    }

    var toBeEmailed;
    var soRec = nlapiGetNewRecord();
    var soId = soRec.getId();
    var custId = nlapiGetFieldValue('entity');
    var multEmail = nlapiLookupField('customer', custId, 'custentity_scg_mult_inv_emails');
    var isPartner = nlapiLookupField('customer', custId, 'custentity_is_partner');

    //Only use Invoice Contact if Customer is not a partner
    if (isPartner == '2') {
        var invContact = '';
    } else {
        var invContact = nlapiGetFieldValue('custbody_invoice_contact');
    }

    var invContactEmail;
    if (!isEmpty(invContact)) {
        invContactEmail = nlapiLookupField('contact', invContact, 'email');
    }

    nlapiLogExecution('DEBUG', 'SO ID', soId);
    nlapiLogExecution('DEBUG', 'Customer', custId);
    nlapiLogExecution('DEBUG', 'Multiple Email Field', multEmail);
    nlapiLogExecution('DEBUG', 'Is Partner', isPartner);
    nlapiLogExecution('DEBUG', 'Invoice Contact: ' + invContact, 'Inv Contact Email: ' + invContactEmail);

    //If the Multiple Email field, and the Invoice Contact field, are empty, exit
    if (isEmpty(multEmail) && isEmpty(invContactEmail)) {
        return;
    }

    if (!isEmpty(multEmail) && !isEmpty(invContactEmail)) {
        toBeEmailed = multEmail + ';' + invContactEmail;
    } else if (!isEmpty(multEmail) && isEmpty(invContactEmail)) {
        toBeEmailed = multEmail;
    } else if (isEmpty(multEmail) && !isEmpty(invContactEmail)) {
        toBeEmailed = invContactEmail;
    }
    nlapiLogExecution('DEBUG', 'To Be Emailed', toBeEmailed);

    var sOrder = nlapiLoadRecord('salesorder', soId);
    sOrder.setFieldValue('email', toBeEmailed);
    nlapiSubmitRecord(sOrder);

}




function isEmpty(stValue) {
    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    }

    return false;
}





/**
 * When Status is set to Approved, if Total = $0, close SO (set Status = Closed)
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_closeZeroDollarOrders(type) {

    //nlapiLogExecution('DEBUG', 'Start closeZeroDollarOrders', 'START START START');
    nlapiLogExecution('DEBUG', 'Type', type);

    //Run on Approve or Edit
    if (type != 'approve' && type != 'edit') {
        return;
    }

    var soRec = nlapiGetNewRecord();
    var soId = soRec.getId();
    var total = soRec.getFieldValue('total');

    nlapiLogExecution('DEBUG', 'SO Total', total);

    if (type == 'edit') {

        var oldRec = nlapiGetOldRecord();
        var oldStatus = oldRec.getFieldValue('orderstatus');
        var newStatus = soRec.getFieldValue('orderstatus');

        nlapiLogExecution('DEBUG', 'Old Status = ' + oldStatus, 'New Status = ' + newStatus);

    }

    if (total == 0 && (type == 'approve' || (type == 'edit' && oldStatus == 'A' && newStatus == 'B'))) {
        //nlapiLogExecution('DEBUG', 'Total = 0', 'RUN CODE TO CLOSE ORDER');

        var sOrder = nlapiLoadRecord('salesorder', soId);

        var itemCount = sOrder.getLineItemCount('item');

        for (var i = 1; itemCount > 0 && i <= itemCount; i++) {

            //var isClosed = sOrder.getLineItemValue('item', 'isclosed', i);
            //nlapiLogExecution('DEBUG', 'Closed Value for Line ' + i, isClosed);

            if (sOrder.getLineItemValue('item', 'isclosed', i) == 'F') {
                nlapiLogExecution('DEBUG', 'Close Line ' + i, 'Set isclosed = T');
                sOrder.setLineItemValue('item', 'isclosed', i, 'T');
            }

        }

        nlapiSubmitRecord(sOrder);

    }

    //nlapiLogExecution('DEBUG', 'End closeZeroDollarOrders', 'END END END');

}





/**
 * Adds FastSpring Fee line item to the order on create if the FastSpring Fee field is not null or 0
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_addFastSpringFee(type) {

    //Only Run on Create
    if (type != 'create') {
        return;
    }

    nlapiLogExecution('DEBUG', 'addFastSpringFee', 'START');

    var fastSprFee = nlapiGetFieldValue('custbody_fastspring_fee');
    //var subsidiary = nlapiGetFieldValue('subsidiary');

    //nlapiLogExecution('DEBUG', 'FastSpring Fee: ' + fastSprFee, 'Subsidiary: ' + subsidiary);
    nlapiLogExecution('DEBUG', 'FastSpring Fee', fastSprFee);

    //if ((isEmpty(fastSprFee) || fastSprFee == 0 || subsidiary != BIZNET_SUB)){
    if ((isEmpty(fastSprFee) || fastSprFee == 0)) {
        //nlapiLogExecution('DEBUG', 'Fastspring Fee is Empty, 0, or Sub != Biznet', 'EXIT');
        nlapiLogExecution('DEBUG', 'Fastspring Fee is Empty, or = 0', 'EXIT');
        return;
    }

    var quantity = '1';
    fastSprFee = fastSprFee * -1;

    //Create Line Item for FastSpring Fee
    nlapiSelectNewLineItem('item');
    nlapiSetCurrentLineItemValue('item', 'item', FASTSPRING_FEE, true, true);
    nlapiSetCurrentLineItemValue('item', 'quantity', quantity, true, true);
    nlapiSetCurrentLineItemValue('item', 'rate', fastSprFee, true, true);
    nlapiCommitLineItem('item');

    nlapiLogExecution('DEBUG', 'FastSpring Fee Line Item Added', 'ADDED');

}




/**
 * Update Billing Start Date and Billing Schedule values if Month to Month Contract is Checked
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_updMonth2MonthContractFields(type) {

    //Only run on create and edit
    //if (type != 'create' && type !='edit'){
    if (type != 'create') {
        return;
    }

    //If type = edit, only run if Add Monthly Billing is checked
    //var addMonthlyBilling = nlapiGetFieldValue('custbody_scg_add_monthly_billing');
    //if (type == 'edit' && addMonthlyBilling == 'F'){
    //return;
    //}

    var m2mContract = nlapiGetFieldValue('custbody_month_to_month_contract');

    if (m2mContract == 'T') {

        var contractStart = nlapiGetFieldValue('custbody_contract_start_date');
        if (!isEmpty(contractStart)) {
            nlapiSetFieldValue('startdate', contractStart);
        }

        var itemCount = nlapiGetLineItemCount('item');

        for (var i = 1; itemCount > 0 && i <= itemCount; i++) {

            var item = nlapiGetLineItemValue('item', 'item', i);
            nlapiLogExecution('DEBUG', 'Month to Month Script', 'ITEM = ' + item);

            if (item != JET_RPTS_SUBS_INIT) {

                nlapiSetLineItemValue('item', 'billingschedule', i, MONTHLY_12);

            }

        }

    }

    //Uncheck Add Monthly Billing if checked
    //if (addMonthlyBilling == 'T'){
    //nlapiSetFieldValue('custbody_scg_add_monthly_billing', 'F');
    //}

}










/**
 * Create Projects and/or set on SO Lines where applicable
 *
 * @appliedtorecord salesorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_so_createProjects(type) {

    if (type != 'approve') {
        return;
    }

    nlapiLogExecution('DEBUG', 'type = ' + type, 'createProjects START');

    var soId = nlapiGetRecordId();
    nlapiLogExecution('DEBUG', 'soId', soId);

    var itemCount = nlapiGetLineItemCount('item');

    for (var i = 1; i <= itemCount; i++) {

        var existProj = nlapiGetLineItemValue('item', 'job', i);
        nlapiLogExecution('DEBUG', 'Project Line ' + i, existProj);

        var createProj = nlapiGetLineItemValue('item', 'custcol_scg_create_proj_by_script', i);
        nlapiLogExecution('DEBUG', 'Create Project by Script Line ' + i, createProj);

        var origProjOrdId = nlapiGetLineItemValue('item', 'custcol_scg_original_project_order_id', i);
        nlapiLogExecution('DEBUG', 'Original Project Order ID Line ' + i, origProjOrdId);

        //Create New Project Code
        if (isEmpty(existProj) && createProj == 'T' && isEmpty(origProjOrdId)) {

            nlapiLogExecution('DEBUG', 'Criteria Met for Project Creation', 'CREATE PROJECT');

            var projRec = nlapiCreateRecord('job');

            //Get values from SO Record
            var customer = nlapiGetFieldValue('entity');
            var subsidiary = nlapiGetFieldValue('subsidiary');
            var item = nlapiGetLineItemValue('item', 'item', i);
            var itemName = nlapiGetLineItemText('item', 'item', i);

            var amt = nlapiGetLineItemValue('item', 'amount', i);
            var qty = nlapiGetLineItemValue('item', 'quantity', i);
            var erp = nlapiGetLineItemValue('item', 'class', i);
            var sfOppId = nlapiGetFieldValue('custbody_sf_opportunity_id');
            var soCurrency = nlapiGetFieldValue('currency');
            var salesGeo = nlapiGetFieldValue('custbody_sales_geo');
            var oppCloseDate = nlapiGetFieldValue('custbody_oppty_close_date');
            var location = nlapiGetLineItemValue('item', 'location', i);
            var serviceType = nlapiGetLineItemValue('item', 'custcol_service_type', i);
            var endUser = nlapiGetFieldValue('custbody_so_enduser');
            var erpVersion = nlapiGetLineItemValue('item', 'custcol_erp_version', i);
            var prodFamily = nlapiGetLineItemValue('item', 'custcol_product_family', i);

            var delType = nlapiGetLineItemValue('item', 'custcol_delivery_type', i);
            var svcsContact = nlapiGetFieldValue('custbody_services_contact');
            var billSched = nlapiGetLineItemValue('item', 'billingschedule', i);
            var satisfClause = nlapiGetLineItemValue('item', 'custcol_satisfaction_clause_required', i);
            var busLine = nlapiGetLineItemValue('item', 'custcol_so_business_line', i);
            var billingType = nlapiGetLineItemValue('item', 'custcol_billing_type', i);
            var poNumber = nlapiGetFieldValue('otherrefnum');
            var oaRevRecRule = nlapiGetLineItemValue('item', 'custcol_oa_rev_rec_rule', i);
            var termStartDate = nlapiGetLineItemValue('item', 'custcol_term_start_date', i);
            var termEndDate = nlapiGetLineItemValue('item', 'custcol_term_end_date', i);
            var revRecStartDate = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
            var revRecEndDate = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);
            var oaBusLine = nlapiGetLineItemValue('item', 'custcol_oa_business_line', i);

            var shipAttn = nlapiGetFieldValue('shipattention');
            var shipAddressee = nlapiGetFieldValue('shipaddressee');
            var shipPhone = nlapiGetFieldValue('shipphone');
            var shipAddr1 = nlapiGetFieldValue('shipaddr1');
            var shipAddr2 = nlapiGetFieldValue('shipaddr2');
            var shipCity = nlapiGetFieldValue('shipcity');
            var shipState = nlapiGetFieldValue('shipstate');
            var shipZip = nlapiGetFieldValue('shipzip');
            var shipCountry = nlapiGetFieldValue('shipcountry');


            nlapiLogExecution('DEBUG', 'Amount', amt);
            nlapiLogExecution('DEBUG', 'Quantity', qty);
            nlapiLogExecution('DEBUG', 'ERP', erp);
            nlapiLogExecution('DEBUG', 'SF Opportunity ID', sfOppId);
            nlapiLogExecution('DEBUG', 'Currency', soCurrency);
            nlapiLogExecution('DEBUG', 'Sales Geo', salesGeo);
            nlapiLogExecution('DEBUG', 'Opportunity Close Date', oppCloseDate);
            nlapiLogExecution('DEBUG', 'Location', location);
            nlapiLogExecution('DEBUG', 'Service Type', serviceType)
            nlapiLogExecution('DEBUG', 'SO End User', endUser);
            nlapiLogExecution('DEBUG', 'SO ERP Version', erpVersion);
            nlapiLogExecution('DEBUG', 'SO Product Family', prodFamily);

            nlapiLogExecution('DEBUG', 'Delivery Type', delType);
            nlapiLogExecution('DEBUG', 'Services Contact', svcsContact);
            nlapiLogExecution('DEBUG', 'Billing Schedule', billSched);
            nlapiLogExecution('DEBUG', 'Satisf Clause Req', satisfClause);
            nlapiLogExecution('DEBUG', 'Business Line', busLine);
            nlapiLogExecution('DEBUG', 'Billing Type', billingType);
            nlapiLogExecution('DEBUG', 'PO Number', poNumber);
            nlapiLogExecution('DEBUG', 'OA Rev Rec Rule', oaRevRecRule);
            nlapiLogExecution('DEBUG', 'Term Start Date', termStartDate);
            nlapiLogExecution('DEBUG', 'Term End Date', termEndDate);
            nlapiLogExecution('DEBUG', 'Rev Rec Start Date', revRecStartDate);
            nlapiLogExecution('DEBUG', 'Rev Rec End Date', revRecEndDate);
            nlapiLogExecution('DEBUG', 'OA Business Line', oaBusLine);
            nlapiLogExecution('DEBUG', 'Ship Attn', shipAttn);
            nlapiLogExecution('DEBUG', 'Ship Addressee', shipAddressee);
            nlapiLogExecution('DEBUG', 'Ship Phone', shipPhone);
            nlapiLogExecution('DEBUG', 'Ship Addr 1', shipAddr1);
            nlapiLogExecution('DEBUG', 'Ship Addr 2', shipAddr2);
            nlapiLogExecution('DEBUG', 'Ship City', shipCity);
            nlapiLogExecution('DEBUG', 'Ship State', shipState);
            nlapiLogExecution('DEBUG', 'Ship Zip', shipZip);
            nlapiLogExecution('DEBUG', 'Ship Country', shipCountry);


            var projTemplate = nlapiGetLineItemValue('item', 'custcol_scg_oa_proj_temp', i);
            nlapiLogExecution('DEBUG', 'Project Template', projTemplate);


            //Update values on Project Record
            projRec.setFieldValue('parent', customer);
            projRec.setFieldValue('subsidiary', subsidiary);
            projRec.setFieldValue('companyname', itemName);

            //Set the Template Value on the Project Record, and check off the Export to OpenAir checkbox
            projRec.setFieldValue('custentity_oa_project_template', projTemplate);
            projRec.setFieldValue('custentity_oa_export_to_openair', 'T');

            //Set Body Fields on Project Record
            projRec.setFieldValue('custentity_so_amount', amt);
            projRec.setFieldValue('custentity_so_quantity', qty);
            projRec.setFieldValue('custentity_so_erp', erp);
            projRec.setFieldValue('custentity_sf_opportunity_id_project', sfOppId);
            projRec.setFieldValue('custentity_so_currency', soCurrency);
            projRec.setFieldValue('currency', soCurrency);
            projRec.setFieldValue('custentity_sales_geo', salesGeo);
            projRec.setFieldValue('custentity_oppty_close_date', oppCloseDate);
            projRec.setFieldValue('custentity_so_product_line', location);
            projRec.setFieldValue('custentity_serv_type', serviceType);
            projRec.setFieldValue('custentity_so_end_user_customer', endUser);
            projRec.setFieldValue('custentity_so_erp_version', erpVersion);
            projRec.setFieldValue('custentity_so_product_family', prodFamily);

            projRec.setFieldValue('custentity_delivery_type', delType);
            projRec.setFieldValue('custentity_services_contact', svcsContact);
            projRec.setFieldValue('custentity_so_billing_schedule', billSched);
            projRec.setFieldValue('custentity_satisfaction_clause_required', satisfClause);
            projRec.setFieldValue('custentity_so_business_line', busLine);
            projRec.setFieldValue('custentity_so_ship_attn', shipAttn);
            projRec.setFieldValue('custentity_so_ship_addressee', shipAddressee);
            projRec.setFieldValue('custentity_so_ship_phone', shipPhone);
            projRec.setFieldValue('custentity_so_ship_addr1', shipAddr1);
            projRec.setFieldValue('custentity_so_ship_addr2', shipAddr2);
            projRec.setFieldValue('custentity_so_ship_city', shipCity);
            projRec.setFieldValue('custentity_so_ship_state', shipState);
            projRec.setFieldValue('custentity_so_ship_zip', shipZip);
            projRec.setFieldValue('custentity_so_ship_country', shipCountry);
            projRec.setFieldValue('custentity_so_billing_type', billingType);
            projRec.setFieldValue('custentity_so_po_number', poNumber);
            projRec.setFieldValue('custentity_oa_rev_rec_rule', oaRevRecRule);
            projRec.setFieldValue('custentity_rev_rec_start_date', revRecStartDate);
            projRec.setFieldValue('custentity_rev_rec_end_date', revRecEndDate);
            projRec.setFieldValue('custentity_oa_business_line', oaBusLine);

            //Check 'Created by Script' to indicate project was created by script
            projRec.setFieldValue('custentity_scg_created_by_script', 'T');

            //Submit Record
            var projectRecord = nlapiSubmitRecord(projRec);
            nlapiLogExecution('DEBUG', 'Project ID', projectRecord);

            //Set the New Project Record on the Line, and reset the Billing Schedule value
			if (projectRecord){
				nlapiSetLineItemValue('item', 'job', i, projectRecord);
				nlapiSetLineItemValue('item', 'billingschedule', i, billSched);
			}

        }//End if (isEmpty(existProj) && createProj == 'T' && isEmpty(origProjOrdId))


        //Set Existing Project Code
        //if (isEmpty(existProj) && createProj == 'T' && !isEmpty(origProjOrdId)){
        if (isEmpty(existProj) && !isEmpty(origProjOrdId)) {

            nlapiLogExecution('DEBUG', 'Criteria Met to Set Existing Project', 'SET EXISTING PROJECT');

            var amt = nlapiGetLineItemValue('item', 'amount', i);
            var qty = nlapiGetLineItemValue('item', 'quantity', i);

            nlapiLogExecution('DEBUG', 'SO Amt = ' + amt, 'SO Qty = ' + qty);

            var projFields = nlapiLookupField('job', origProjOrdId, ['custentity_so_quantity', 'custentity_so_amount']);
            var projAmt = projFields.custentity_so_amount;
            var projQty = projFields.custentity_so_quantity;
            nlapiLogExecution('DEBUG', 'projAmt = ' + projAmt, 'projQty = ' + projQty);

            var newProjAmt = Number(projAmt) + Number(amt);
            var newProjQty = Number(projQty) + Number(qty);
            //var newProjAmt = projAmt + amt;
            //var newProjQty = projQty + qty;
            nlapiLogExecution('DEBUG', 'new Proj Amt = ' + newProjAmt, 'new Proj Qty = ' + newProjQty);

            //Update values on existing Project Record
            nlapiSubmitField('job', origProjOrdId, ['custentity_so_quantity', 'custentity_so_amount', 'custentity_oa_export_to_openair'], [newProjQty, newProjAmt, 'T']);

            //Set the Updated Project Record on the Line, and reset the Billing Schedule value
			nlapiSetLineItemValue('item', 'job', i, origProjOrdId);
			nlapiSetLineItemValue('item', 'billingschedule', i, billSched);


        }//End if (isEmpty(existProj) && createProj == 'T' && !isEmpty(origProjOrdId))


    }//End for i loop



    nlapiLogExecution('DEBUG', 'createProjects', 'END');

}



