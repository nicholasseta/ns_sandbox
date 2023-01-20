/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       22 Aug 2018     Doug Humberd     Updates the "Long Date" field on Sales Order, Invoice, Cash Refund, Cash Sale, and Return Authorization records
 * 1.10       19 Sep 2018     Doug Humberd     Updated "is_trans_setLongDate" to handle different date formats, and changed the format that the long date is being written in
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, cashsale, cashrefund, returnauthorization
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_trans_beforeLoad(type, form, request){
    try {
        //is_trans_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_trans_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, cashsale, cashrefund, returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_trans_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_trans_setLongDate(type);
    } catch (e) {
        is_trans_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, cashsale, cashrefund, returnauthorization
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_trans_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_trans_afterSubmit(type);
    } catch (e) {
        is_trans_logError(e);
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
function is_trans_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_trans_setLongDate(type){
	
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	//var dateFormat = nlapiGetContext().getPreference('DATEFORMAT');
	//nlapiLogExecution('DEBUG', 'Date Format', dateFormat);
	
	var date = nlapiGetFieldValue('trandate');
	//date = new Date(date);
	date = nlapiStringToDate(date, 'datetime');
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	
	//Convert Month to Text
	var monthText = '';
	switch (month){//0 = January, 1 = February...11 = December
	case 0:
		monthText = 'Jan';
		break;
	case 1:
		monthText = 'Feb';
		break;
	case 2:
		monthText = 'Mar';
		break;
	case 3:
		monthText = 'Apr';
		break;
	case 4:
		monthText = 'May';
		break;
	case 5:
		monthText = 'Jun';
		break;
	case 6:
		monthText = 'Jul';
		break;
	case 7:
		monthText = 'Aug';
		break;
	case 8:
		monthText = 'Sep';
		break;
	case 9:
		monthText = 'Oct';
		break;
	case 10:
		monthText = 'Nov';
		break;
	case 11:
		monthText = 'Dec';
		break;
	default:
		break;
	}
	
	//Format Date in Long Date Format
	//var longDate = day + ' ' + monthText + ' ' + year;
	var longDate = monthText + '-' + day + '-' + year;
	nlapiLogExecution('DEBUG', 'Long Date', longDate);
	
	nlapiSetFieldValue('custbody_scg_long_date', longDate);
	
}


