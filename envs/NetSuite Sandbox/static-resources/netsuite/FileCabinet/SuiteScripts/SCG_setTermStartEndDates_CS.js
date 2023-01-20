/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Mar 2019     Doug Humberd     Script to update Term Start Date and Term End Date fields on transaction record when Rev Rec Start & End Dates are modified
 * 1.10       22 Aug 2019     Doug Humberd     Updated 'is_std_updateTermStartEndDates' to not update on Rev Rec Date change if Invoice and Month-to-Month Contract is checked
 * 1.20       12 Jun 2020     Doug Humberd     Updated for new Rev Rec Rules: '3 Week Rev Rec' and '1 Week Rev Rec'
 * 1.21       12 Apr 2021     Matt Poloni      Refector from JS Date API to NS dates API
 * 1.25       01 Oct 2021     Doug Humberd     Updated to include Rev Rec Rule: ISW Per Start & End Date
 * 1.30       30 Jun 2022     Doug Humberd     Updated for new Rev Rec Rules (post SF Billing)
 *
 */


/**
 * Constants
 */
const PER_START_AND_END_DATE = '7';
const ONE_WEEK_REV_REC = '11';//Rev Rec Rule - Validate in PROD
const THREE_WEEK_REV_REC = '10';//Rev Rec Rule - Validate in PROD
const ISW_PER_START_END_DATE = '16';//Rev Rec Rule - Validate in PROD
const ISW_LICENSE = '13';//Rev Rec Rule - Validate in PROD
const ISW_100_PCT_ON_INVOICING = '14';//Rev Rec Rule - Validate in PROD



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_std_logError(e) {
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
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_std_fieldChanged(type, name, linenum) {
    try {
        is_std_updateTermStartEndDates(type, name, linenum);
    } catch (e) {
        is_std_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_std_postSourcing(type, name) {
    try {
        //is_std_postSourcingFunction(type, name);
    } catch (e) {
        is_std_logError(e);
        throw e;
    }
}



function isEmpty(stValue) {
    if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
        return true;
    }

    return false;
}




/**
 * Updates the Term Start Date and Term End Date fields on the transaction record if the Rev Rec Rule = Per Start and End Date, and the Rev Rec Start Date or Rev Rec End Date fields are modified
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_std_updateTermStartEndDates(type, name, linenum) {

    if (name == 'custcol_rev_rec_start_date') {

        var revRecStart = nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_start_date');

        var transType = nlapiGetRecordType();

        if (transType == 'invoice') {
            var m2mContract = nlapiGetFieldValue('custbody_month_to_month_contract');
        }
        
        if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == PER_START_AND_END_DATE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_PER_START_END_DATE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_LICENSE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_100_PCT_ON_INVOICING) {

            if (transType != 'invoice') {

                nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', revRecStart);

            } else {

                if (m2mContract == 'F') {

                    nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', revRecStart);

                }

            }

        }//End if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == PER_START_AND_END_DATE)

        if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ONE_WEEK_REV_REC) {

            nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', revRecStart);

            // var d7 = new Date(revRecStart); // replacement below
            var d7 = nlapiStringToDate(nlapiDateToString(new Date(), 'date'));
            // d7.setDate(d7.getDate() + 7); // replacement below
            d7 = nlapiAddDays(d7, 7);
            var revRecEnd = nlapiDateToString(d7, 'date');
            nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', revRecEnd);

        }//End if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ONE_WEEK_REV_REC)

        if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == THREE_WEEK_REV_REC) {

            nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', revRecStart);

            // var d21 = new Date(revRecStart); // replacement below
            var d21 = nlapiStringToDate(nlapiDateToString(new Date(), 'date'));
            // d21.setDate(d21.getDate() + 21); // replacement below
            d21 = nlapiAddDays(d21, 21);
            var revRecEnd = nlapiDateToString(d21, 'date');
            nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', revRecEnd);

        }//End if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == THREE_WEEK_REV_REC)

    }//End if (name == 'custcol_rev_rec_start_date')

    if (name == 'custcol_rev_rec_end_date') {

        var revRecEnd = nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_end_date');

        var transType = nlapiGetRecordType();

        if (transType == 'invoice') {
            var m2mContract = nlapiGetFieldValue('custbody_month_to_month_contract');
        }

        if (nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == PER_START_AND_END_DATE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_PER_START_END_DATE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_LICENSE || nlapiGetCurrentLineItemValue('item', 'custcol_rev_rec_rule') == ISW_100_PCT_ON_INVOICING) {

            if (transType != 'invoice') {

                nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', revRecEnd);

            } else {

                if (m2mContract == 'F') {

                    nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', revRecEnd);

                }

            }

        }

    }

}


