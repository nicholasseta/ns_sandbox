/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Mar 2019     Doug Humberd     Script to set Term Start Date and Term End Date fields on transaction records on create
 * 1.10       22 Aug 2019     Doug Humberd     Updated 'is_std_setTermStartEndDates' to set Term Start/End Dates if Invoice has Month-to-Month Contract checked (Invoice Only)
 * 1.15       01 Feb 2020     Doug Humberd     Updated to Load/Submit the record only once rather than on every iteration of the loop
 * 1.20       16 Jun 2020     Doug Humberd     Updated for new Rev Rec Rules: '3 Week Rev Rec' and '1 Week Rev Rec'
 * 1.25       28 Dec 2020     Doug Humberd     Updated for new Rev Rec Rule: 'Start Plus 7 Days'
 * 1.26       14 Jan 2021     Doug Humberd     Per John, Remove all logic for 'Start Plus 7 Days'
 * 
 * 1.31       12 Apr 2021     Matt Poloni      Refector from JS Date API to NS dates API
 * 1.35       01 Oct 2021     Doug Humberd     Updated to include Rev Rec Rule: ISW Per Start & End Date
 * 1.40       30 Jun 2022     Doug Humberd     Updated for new Rev Rec Rules (post SF Billing)
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const ONE_WEEK_REV_REC = '11';//Rev Rec Rule - Validate in PROD
const THREE_WEEK_REV_REC = '10';//Rev Rec Rule - Validate in PROD
//const START_PLUS_SEVEN_DAYS = '12';//Rev Rec Rule - Validate in PROD

const ISW_PER_START_END_DATE = '16';//Rev Rec Rule - Validate in PROD
const ISW_LICENSE = '13';//Rev Rec Rule - Validate in PROD
const ISW_100_PCT_ON_INVOICING = '14';//Rev Rec Rule - Validate in PROD


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_std_beforeLoad(type, form, request) {
    try {
        //is_std_beforeLoadScript(type, form, request);
    } catch (e) {
        is_std_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_std_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_std_beforeSubmitScript(type);
    } catch (e) {
        is_std_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_std_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_std_setTermStartEndDates(type);
    } catch (e) {
        is_std_logError(e);
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
function is_std_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



/**
 * Sets the Term Start Date and Term End Date fields on the transaction record if the Rev Rec Rule = Per Start and End Date
 * Set Term Start/End Dates if Invoice has Month-to-Month Contract checked (Invoice Only) - updated 8/22/19
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_std_setTermStartEndDates(type) {

    nlapiLogExecution('DEBUG', 'Start setTermStartEndDates', 'START');

    //Only run on create
    if (type != 'create') {
        return;
    }

    var transRec = nlapiGetNewRecord();
    var transId = transRec.getId();
    var transType = transRec.getRecordType();
    var m2mContract;
    nlapiLogExecution('DEBUG', 'Transaction ID', transId);
    nlapiLogExecution('DEBUG', 'Transaction Type', transType);

    var createdFrom = nlapiGetFieldValue('createdfrom');

    if (transType == 'invoice') {
        m2mContract = transRec.getFieldValue('custbody_month_to_month_contract');
        nlapiLogExecution('DEBUG', 'Month-to-Month Contract', m2mContract);

        if (m2mContract == 'T') {

            var tranDate = nlapiGetFieldValue('trandate');
            nlapiLogExecution('DEBUG', 'Date', tranDate);

            //Calculate transaction date + 1 month
            // var d = new Date(tranDate); // replacement below
            var d = nlapiStringToDate(tranDate);

            // d.setMonth(d.getMonth() + 1); // replacement below
            d = nlapiAddMonths(d, 1);
            // d.setDate(d.getDate() - 1); // replacement below
            d = nlapiAddDays(d, -1);

            var datePlus1Month = nlapiDateToString(d, 'date');
            nlapiLogExecution('DEBUG', 'New Date', datePlus1Month);

        }

    }//End if (transType == 'invoice')

    var trRec = nlapiLoadRecord(transType, transId);

    var itemCount = nlapiGetLineItemCount('item');

    for (var i = 1; itemCount > 0 && i <= itemCount; i++) {

        var revRecRule = nlapiGetLineItemValue('item', 'custcol_rev_rec_rule', i);
        nlapiLogExecution('DEBUG', 'Rev Rec Rule line ' + i, revRecRule);
        
        //Only run if Rev Rec Rule = Per Start & End Date (7)
        if (revRecRule == '7' || revRecRule == ISW_PER_START_END_DATE || revRecRule == ISW_LICENSE || revRecRule == ISW_100_PCT_ON_INVOICING) {
            //nlapiLogExecution('DEBUG', 'Got a Hit on Rev Rec Rule', 'Update Term Dates');

            if (transType != 'invoice') {

                var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
                var revRecEnd = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);

                if (!isEmpty(revRecStart)) {
                    nlapiLogExecution('DEBUG', 'Rev Rec Start Line ' + i, revRecStart);
                    //var trRec = nlapiLoadRecord(transType, transId);
                    trRec.setLineItemValue('item', 'custcol_term_start_date', i, revRecStart);
                    //nlapiSubmitRecord(trRec);
                }

                if (!isEmpty(revRecEnd)) {
                    nlapiLogExecution('DEBUG', 'Rev Rec End Line ' + i, revRecEnd);
                    //var trRec = nlapiLoadRecord(transType, transId);
                    trRec.setLineItemValue('item', 'custcol_term_end_date', i, revRecEnd);
                    //nlapiSubmitRecord(trRec);
                }

            } else {

                if (m2mContract == 'T') {

                    //var trRec = nlapiLoadRecord(transType, transId);
                    trRec.setLineItemValue('item', 'custcol_term_start_date', i, tranDate);
                    trRec.setLineItemValue('item', 'custcol_term_end_date', i, datePlus1Month);
                    //nlapiSubmitRecord(trRec);

                } else {//if m2mContract == 'F'

                    var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
                    var revRecEnd = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);

                    if (!isEmpty(revRecStart)) {
                        nlapiLogExecution('DEBUG', 'Rev Rec Start Line ' + i, revRecStart);
                        //var trRec = nlapiLoadRecord(transType, transId);
                        trRec.setLineItemValue('item', 'custcol_term_start_date', i, revRecStart);
                        //nlapiSubmitRecord(trRec);
                    }

                    if (!isEmpty(revRecEnd)) {
                        nlapiLogExecution('DEBUG', 'Rev Rec End Line ' + i, revRecEnd);
                        //var trRec = nlapiLoadRecord(transType, transId);
                        trRec.setLineItemValue('item', 'custcol_term_end_date', i, revRecEnd);
                        //nlapiSubmitRecord(trRec);
                    }

                }//End if m2mContract

            }

        }//End if (revRecRule == '7')


        //Only run if Rev Rec Rule = 1 Week Rev Rec
        if (revRecRule == ONE_WEEK_REV_REC) {

            var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);

            if (!isEmpty(revRecStart)) {
                nlapiLogExecution('DEBUG', 'Rev Rec Start Line ' + i, revRecStart);

                // var d7 = new Date(revRecStart); // replacement below
                var d7 = nlapiStringToDate(nlapiDateToString(new Date(), 'date'));
                // d7.setDate(d7.getDate() + 7); // replacement below
                d7 = nlapiAddDays(d7, 7);
                var revRecEnd = nlapiDateToString(d7, 'date');
                nlapiLogExecution('DEBUG', 'Rev Rec End Line ' + i, revRecEnd);

                trRec.setLineItemValue('item', 'custcol_term_start_date', i, revRecStart);
                trRec.setLineItemValue('item', 'custcol_term_end_date', i, revRecEnd);

            }

        }//End if (revRecRule == ONE_WEEK_REV_REC)


        //Only run if Rev Rec Rule = 3 Week Rev Rev
        if (revRecRule == THREE_WEEK_REV_REC) {

            var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);

            if (!isEmpty(revRecStart)) {
                nlapiLogExecution('DEBUG', 'Rev Rec Start Line ' + i, revRecStart);

                // var d21 = new Date(revRecStart); // replacement below
                var d21 = nlapiStringToDate(nlapiDateToString(new Date(), 'date'));
                // d21.setDate(d21.getDate() + 21); // replacement below
                d21 = nlapiAddDays(d21, 21);
                var revRecEnd = nlapiDateToString(d21, 'date');
                nlapiLogExecution('DEBUG', 'Rev Rec End Line ' + i, revRecEnd);

                trRec.setLineItemValue('item', 'custcol_term_start_date', i, revRecStart);
                trRec.setLineItemValue('item', 'custcol_term_end_date', i, revRecEnd);

            }

        }//End if (revRecRule == THREE_WEEK_REV_REC)


    }//End for i loop

    nlapiSubmitRecord(trRec);

}





function isEmpty(stValue) {
    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    }

    return false;
}



