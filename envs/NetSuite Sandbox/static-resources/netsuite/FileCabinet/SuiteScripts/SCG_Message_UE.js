/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 Feb 2020     Doug Humberd     Handles user events on Message records
 * 1.05       03 Mar 2020     Doug Humberd     Updated to read Product Line value from Item Record, not from Invoice
 * 1.10       06 Jul 2020     Doug Humberd     Updated to not run if record is not 'transaction'
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PRODLINE_ATLAS = '4';
const PRODLINE_HUBBLE = '126';
const PRODLINE_SPREADSHEET_SVR = '17';
const PRODLINE_WANDS_ORACLE = '105';
const PRODLINE_WANDS_SAP = '106';
const FLIER_ATLAS = '742992';
const FLIER_HUBBLE = '742993';
const FLIER_SPREADSHEET_SVR = '742994';
const FLIER_WANDS_ORACLE = '742995';
const FLIER_WANDS_SAP = '742996';


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord message
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_msg_beforeLoad(type, form, request){
    try {
    	is_msg_addAttachment(type, form, request);
        //is_msg_beforeLoadScript(type, form, request);
    } catch (e) {
        is_msg_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord message
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_msg_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_msg_beforeSubmitScript(type);
    } catch (e) {
        is_msg_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord message
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_msg_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_msg_afterSubmitScript(type);
    } catch (e) {
        is_msg_logError(e);
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
function is_msg_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
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





/**
 * Attaches a file based on Product Line value
 *
 * @appliedtorecord message
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_msg_addAttachment(type, form, request){
	
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'msg_addAttachment', 'START');
	
	var transaction = nlapiGetFieldValue('transaction');
	nlapiLogExecution('DEBUG', 'transaction', transaction);
	
	//Only run if transaction value is found
	if (isEmpty(transaction)){
		return;
	}
	
	var searchresults = getRecType(transaction);
	
	if (searchresults){
		
		recType = searchresults[0].getValue('recordtype');
		nlapiLogExecution('DEBUG', 'recType', recType);
		
		if (recType == 'invoice'){
			
			var attachFile = 'F';
			
			var transRec = nlapiLoadRecord(recType, transaction);
			
			var ordType = transRec.getFieldValue('custbody_so_ordertype');
			nlapiLogExecution('DEBUG', 'Order Type', ordType);
			
			var custBillTo = transRec.getFieldValue('entity');
			var endUser = transRec.getFieldValue('custbody_so_enduser');
			nlapiLogExecution('DEBUG', 'custBillTo = ' + custBillTo, 'endUser = ' + endUser);
			
			var dueDate = transRec.getFieldValue('duedate');
			var today = new Date();
			today.setDate(today.getDate() - 30);
			var todayMinus30 = nlapiDateToString(today, 'date');
			nlapiLogExecution('DEBUG', 'Due Date', dueDate);
			nlapiLogExecution('DEBUG', 'Today Minus 30', todayMinus30);
			
			var d1 = new Date(dueDate);
			var d2 = new Date(todayMinus30);
			
			/*
			if (d1.getTime() < d2.getTime()){
				var marker = 'Less Than'
			}
			if (d1.getTime() > d2.getTime()){
				var marker = 'Greater Than'
			}
			if (d1.getTime() == d2.getTime()){
				var marker = 'Equals'
			}
			nlapiLogExecution('DEBUG', 'Marker', marker);
			*/
			
			//Only run if Order Type = Renewal, Customer Bill To = End User, and if Due Date is not > 30 days overdue  
			//if (ordType != '3' || custBillTo != endUser || dueDate < todayMinus30){
			if (ordType != '3' || custBillTo != endUser || d1.getTime() < d2.getTime()){
				nlapiLogExecution('DEBUG', 'Either Order Type != Renewal, Cust Bill To != End User, or Due Date < ' + todayMinus30, 'EXIT');
				return;
			}
			
			//var transRec = nlapiLoadRecord(recType, transaction);
			
			var itemRecType = '';
			var itemCount = transRec.getLineItemCount('item');
			
			for (var i = 1; i <= itemCount; i++){
				
				//Check Product Family on Invoice Line to see if = Hubble
				var prodFamily = transRec.getLineItemValue('item', 'custcol_product_family', i);
				nlapiLogExecution('DEBUG', 'Product Family', prodFamily);
				
				if (!isEmpty(prodFamily) && prodFamily == 'Hubble'){
					var prodLine = PRODLINE_HUBBLE;
					attachFile = 'T';
					break;
				}
				
				//If Prod Family != Hubble, Lookup Product Line (Item) value from Item Record
				var itemId = transRec.getLineItemValue('item', 'item', i);
				var itemType = transRec.getLineItemValue('item', 'itemtype', i);
				nlapiLogExecution('DEBUG', 'itemId = ' + itemId, 'itemType = ' + itemType);
				
				switch(itemType){
				
				case 'NonInvtPart':
					itemRecType = 'noninventoryitem';
				break;
					
				case 'Service':
					itemRecType = 'serviceitem';
				break;
				
				}
				
				nlapiLogExecution('DEBUG', 'itemRecType', itemRecType);
				
				if (itemRecType != ''){
					//var prodLine = transRec.getLineItemValue('item', 'location', i);
					var prodLine = nlapiLookupField(itemRecType, itemId, 'custitem_product_line_item');
					nlapiLogExecution('DEBUG', 'Product Line Value Found', prodLine);
				}
				
				
				if (!isEmpty(prodLine)){
					attachFile = 'T';
					break;
				}
				
			}//End for i loop
			
			if (attachFile == 'T'){
				
				switch (prodLine){
				case PRODLINE_ATLAS:
					nlapiLogExecution('DEBUG', 'Attach Atlas Flier', 'ATLAS');
					
					nlapiSelectNewLineItem('mediaitem');
					nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', FLIER_ATLAS);
					nlapiCommitLineItem('mediaitem');
					
				break;
					
				case PRODLINE_HUBBLE:
					nlapiLogExecution('DEBUG', 'Attach Hubble Flier', 'HUBBLE');
					
					nlapiSelectNewLineItem('mediaitem');
					nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', FLIER_HUBBLE);
					nlapiCommitLineItem('mediaitem');
					
				break;
				
				case PRODLINE_SPREADSHEET_SVR:
					nlapiLogExecution('DEBUG', 'Attach Spreadsheet Server Flier', 'SPREADSHEET SERVER');
					
					nlapiSelectNewLineItem('mediaitem');
					nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', FLIER_SPREADSHEET_SVR);
					nlapiCommitLineItem('mediaitem');
					
				break;
					
				case PRODLINE_WANDS_ORACLE:
					nlapiLogExecution('DEBUG', 'Attach Wands Oragle Flier', 'WANDS ORACLE');
					
					nlapiSelectNewLineItem('mediaitem');
					nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', FLIER_WANDS_ORACLE);
					nlapiCommitLineItem('mediaitem');
					
				break;
					
				case PRODLINE_WANDS_SAP:
					nlapiLogExecution('DEBUG', 'Attach Wands SAP Flier', 'WANDS SAP');
					
					nlapiSelectNewLineItem('mediaitem');
					nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', FLIER_WANDS_SAP);
					nlapiCommitLineItem('mediaitem');
					
				break;
				
				default://No Flyer for Product Line
					nlapiLogExecution('DEBUG', 'No Flyer for Product Line', 'NO FILE ATTACHED')
				break;
				
				}//End switch (prodLine)
				
			}//End if (attachFile == 'T')
			
		}
		
	}
	
}




function getRecType(transaction){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', transaction));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('recordtype', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('transaction', null, filters, columns);
	  
	// Return
	return results;
	
}