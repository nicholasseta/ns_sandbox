/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       19 Nov 2019     Madhuri Reddy    Initial Version
 * 1.10       20 Jan 2020     Doug Humberd     Updated to lookup and use internal id for Account 'Recurring Subscription (On-Prem Term License) Revenue'
 * 1.15       23 Jan 2020     Doug Humberd     Updated to identify 3rd Party Commission items, and if found to sum all 3rd Party Commission Amounts into a single Print Amount column
 * 1.20       14 Apr 2020     Doug Humberd     Updated to only run if <= 150 lines, else create custom record and run Sched Script
 * 1.21       16 Apr 2020     Doug Humberd     Additional updates to run in edit mode - only if either Inv Total has changed, or Order Type has changed
 * 1.25       24 Apr 2020     Doug Humberd     Updated to test for scenarios when 'If incAcct = null'
 * 1.30       28 Apr 2020     Doug Humberd     Updated to include checks for Account 662
 * 1.31       07 May 2020     Doug Humberd     Added functionality to check off a "print amount updates pending" checkbox
 * 1.35       13 Jul 2020     Doug Humberd     Updated to include additional subtotaling by taxcode
 * 1.40       18 Mar 2022     Doug Humberd     Updated to check for Bundle Name before including in calculation
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const RECURR_SUBSCR_REV_ACCT = '661';//Account: Recurring Subscription (On-Prem Term License) Revenue
const SAAS_REVENUE_ACCT = '662';//Account: SaaS Revenue



function print_invoice_html(type) {
  if (type === 'delete') {
    return;
  }
  try {
	  
	  nlapiLogExecution('DEBUG', 'print_invoice_html LIBRARY', 'START');
	  nlapiLogExecution('DEBUG', 'Execution Type', type);
	  
	var startUsage = nlapiGetContext().getRemainingUsage();
	nlapiLogExecution('DEBUG', 'Start Usage', startUsage);
	var endUsage;
	
	var amtChanged = 'F';
	if (type != 'create'){
		var oldInvRec = nlapiGetOldRecord();
		var newInvRec = nlapiGetNewRecord();
		var oldTotal = oldInvRec.getFieldValue('total');
		var newTotal = newInvRec.getFieldValue('total');
		nlapiLogExecution('DEBUG', 'oldTotal = ' + oldTotal, 'newTotal = ' + newTotal);
		if (newTotal != oldTotal){
			amtChanged = 'T';
		}
		var oldOrdType = oldInvRec.getFieldValue('custbody_so_ordertype');
		var newOrdType = newInvRec.getFieldValue('custbody_so_ordertype');
		nlapiLogExecution('DEBUG', 'oldOrdType = ' + oldOrdType, 'newOrdType = ' + newOrdType);
		if (newOrdType != oldOrdType){
			amtChanged = 'T';
		}
	}
	amtChanged = 'T';//TEMP CODE FOR TESTING - TO BE REMOVED - - 12/10/20 CHERRIE AND DOUG - Uncomment this line so that this script always runs in edit mode.
	if (type != 'create' && amtChanged == 'F'){
		nlapiLogExecution('DEBUG', 'NOT in Create Mode, Amount and/or Order Type did NOT Change', 'RETURN');
		return;
	}
	
	var invId = nlapiGetRecordId();
	  
    var rec = nlapiLoadRecord(nlapiGetRecordType(), invId);

    var lineCount = rec.getLineItemCount('item');
    
    if (lineCount > 150){
    	
    	nlapiLogExecution('DEBUG', 'Line Count > 150', 'Create Cust Rec.  Execute Sched Script.  EXIT');
    	
    	var custRecExists = is_upa_getPrintAmtQueueIds(invId);
    	
    	if (custRecExists){
    		nlapiLogExecution('DEBUG', 'Custom Record Already Exists in Queue', 'SCHED SCRIPT & EXIT');
    		
    		var scriptSched = nlapiScheduleScript('customscript_scg_invoice_print_ss', 'customdeploy_scg_invoice_print_ss');
			nlapiLogExecution('DEBUG', 'Update Print Amount Script Queued - ID: ', scriptSched);
			
			//Check 'Print Amount Updates Pending' to indicate scheduled job has not completed processing
			nlapiSubmitField('invoice', invId, 'custbody_scg_print_amt_upds_pend', 'T');
			nlapiLogExecution('DEBUG', 'Print Amount Updates Pending', 'CHECKED');
    		
    		return;
    	}
    	
    	var updPrintAmtQueueRec = nlapiCreateRecord('customrecord_scg_updprintamount_queue');
		
		// Create Update Print Amount Processing Queue record
		updPrintAmtQueueRec.setFieldValue('custrecord_scg_upa_transaction', invId);
		//updPrintAmtQueueRec.setFieldValue('custrecord_scg_pots_trans_type', transType);
		updPrintAmtQueueRec.setFieldValue('custrecord_scg_upa_complete', 'F');
		var updPrintAmtProcQueueRecId = nlapiSubmitRecord(updPrintAmtQueueRec);
		
		if (updPrintAmtProcQueueRecId){
			
			var scriptSched = nlapiScheduleScript('customscript_scg_invoice_print_ss', 'customdeploy_scg_invoice_print_ss');
			nlapiLogExecution('DEBUG', 'Update Print Amount Script Queued - ID: ', scriptSched);
			
			//Check 'Print Amount Updates Pending' to indicate scheduled job has not completed processing
			nlapiSubmitField('invoice', invId, 'custbody_scg_print_amt_upds_pend', 'T');
			nlapiLogExecution('DEBUG', 'Print Amount Updates Pending', 'CHECKED');
			
			//nlapiSubmitField('invoice', invId, 'custbody_scg_run_update', 'T');
			//nlapiLogExecution('DEBUG', 'AS Run Update Set to', 'T');
		}else {
			throw nlapiCreateError('PROCESS_TRANSACTION-NOT_IN_QUEUE', 'The transaction could not be placed in the Update Print Amount Processing Queue.', false);
		}
    	
    	nlapiLogExecution('DEBUG', 'print_invoice_html LIBRARY', 'RETURN');
		
    	return;
    	
    }//End if (lineCount > 150)
    
    nlapiLogExecution('DEBUG', 'Line Count <= 150', 'Update Print Amounts');
    
    var orderType = rec.getFieldValue('custbody_so_ordertype');
    var printExpanded = rec.getFieldValue('custbody_expand_licenses_on_invoice');
    var printCollapsed = false;
    // Use custom print amount field
    // Income Account = Recurring Subscriptions
    // Order Type = Renewal
    // Expand License on Invoice = False
    nlapiLogExecution('debug', 'orderType', orderType);
    if (orderType == 3 && printExpanded === 'F') {
      printCollapsed = true;
    }
    
    var arrProdFamTaxCode = [];
    //var arrProdFamily = [];
    //var arrProdDesc = [];
    var arrProdAmt = [];
    var arrLine = [];
    for (var i = 1; i <= lineCount; i++) {
      rec.setLineItemValue('item', 'custcol_print_amount', i, '');
      var prodFamily = rec.getLineItemValue("item", "custcol_product_family", i);
      var incAcct = rec.getLineItemValue("item", "custcol_ava_incomeaccount", i);
      nlapiLogExecution('debug', 'incAcct', incAcct + ', ' + typeof incAcct);
      var taxCode = rec.getLineItemValue("item", "taxcode", i);
      nlapiLogExecution('DEBUG', 'taxCode', taxCode);
      var bundleName = rec.getLineItemValue("item", "custcol_bundle_name", i);
      nlapiLogExecution('DEBUG', 'Bundle Name', bundleName);
      
      if (!isEmpty(bundleName)){
    	  continue;
      }
      
      var concatProdFamTaxCode = prodFamily + '--' + taxCode;
      nlapiLogExecution('DEBUG', 'Concatenate Prod Fam & Tax Code', concatProdFamTaxCode);
      
      //If incAcct = null, set to String Value so that Search does not fail.  Then set incAcctId to an invalid internal id (0) so that the script won't error later
      if (incAcct == null){
    	  nlapiLogExecution('DEBUG', 'incAcct null', 'NULL');
    	  incAcct = 'IncAcct Not Found';
    	  var incAcctId = 0;
      }
      
      //Get the internal id for the 'Income Account'
      var IncAcctSearch = getIncAcctID(incAcct);
      
      if (IncAcctSearch){
    	  var incAcctId = IncAcctSearch[0].getValue('internalid');
    	  var incAcctName = IncAcctSearch[0].getValue('name');
    	  //nlapiLogExecution('DEBUG', 'INC ACCT SEARCH Income Acct ID', incAcctId);
    	  //nlapiLogExecution('DEBUG', 'INC ACCT SEARCH Income Acct Name', incAcctName);
      }//End if (fromSubsearch)
      
      //if (incAcct === 'Recurring Subscription (On-Prem Term License) Revenue' && printCollapsed) {
      if ((incAcctId === RECURR_SUBSCR_REV_ACCT || incAcctId === SAAS_REVENUE_ACCT) && printCollapsed) {
    	  //if (arrProdFamily.indexOf(prodFamily) < 0) {
    	  if (arrProdFamTaxCode.indexOf(concatProdFamTaxCode) < 0) {
    		  //nlapiLogExecution('debug', i, '1');
    		  var ind = arrProdFamTaxCode.length || 0;
    		  arrProdFamTaxCode[ind] = concatProdFamTaxCode;
    		  //arrProdFamily[ind] = prodFamily;
    		  //arrProdDesc[ind] = rec.getLineItemValue("item", "custcol_description_pdf", i);
    		  arrProdAmt[ind] = parseFloat(rec.getLineItemValue("item", "amount", i));
    		  arrLine[ind] = i;
    		  continue;
        } else {
        	//nlapiLogExecution('debug', i, '2');
        	//var index = arrProdFamily.indexOf(prodFamily);
        	var index = arrProdFamTaxCode.indexOf(concatProdFamTaxCode);
        	arrProdAmt[index] += parseFloat(rec.getLineItemValue("item", "amount", i));
        	continue;
    	}
      }
      //nlapiLogExecution('debug', i, '3');
      rec.setLineItemValue('item', 'custcol_print_amount', i, rec.getLineItemValue("item", "amount", i));
      
      endUsage = nlapiGetContext().getRemainingUsage();
      nlapiLogExecution('DEBUG', 'End Usage Loop 1 Line ' + i, endUsage);
      
    }
    nlapiLogExecution('DEBUG', 'Finished 1st Loop', '1');

    for (var j = 0; j < arrProdFamTaxCode.length; j++) {
      sObj = {
    	'concatProdFamTaxCode': arrProdFamTaxCode[j],
        //'productFamily': arrProdFamily[j],
        //'desc': arrProdDesc[j],
        'amount': arrProdAmt[j],
        'line': arrLine[j]
      };
      rec.setLineItemValue('item', 'custcol_print_amount', arrLine[j], arrProdAmt[j]);
    }
    nlapiLogExecution('DEBUG', 'Finished 2nd Loop', '2');
    
    endUsage = nlapiGetContext().getRemainingUsage();
    nlapiLogExecution('DEBUG', 'End Usage', endUsage);
    
    
    nlapiLogExecution('DEBUG', 'Start 3rd party processing', 'START 3RD PTY');
    //Identify 3rd Party Commission items, and if found to sum all 3rd Party Commission Amounts into a single Print Amount column (on the first instance of a 3rd Party Commission line)
    //var printAmtTotal = 0;
    //var z = 0;
    var lastItemLookup;
    
    var arrTPtaxCode = [];
    var arrThirdPtyAmt = [];
    var arrTPLine = [];
    nlapiLogExecution('DEBUG', 'lineCount 3rd Party', lineCount);
    for (var x = 1; x <= lineCount; x++){
    	
    	var itemId = rec.getLineItemValue('item', 'item', x);
    	//var itemText = rec.getLineItemText('item', 'item', x);
    	var itemType = rec.getLineItemValue('item', 'itemtype', x);
    	
    	//if (itemText.indexOf('commission') != '-1' && itemType == 'NonInvtPart'){
    	if (itemType == 'NonInvtPart'){
    		
    		if (itemId != lastItemLookup){
    			
    			var thirdPtyCommItem = nlapiLookupField('noninventoryitem', itemId, 'custitem_scg_third_party_commission');
    			lastItemLookup = itemId;
    			
    		}
    		//var thirdPtyCommItem = nlapiLookupField('noninventoryitem', itemId, 'custitem_scg_third_party_commission');
    		
    		if (thirdPtyCommItem == 'T'){
    			nlapiLogExecution('DEBUG', '3rd party item found line ' + x, 'FOUND');
    			//Clear out Existing Value, if any, in the 'Print Amount' field
    	    	rec.setLineItemValue('item', 'custcol_print_amount', x, '');
    	    	
    	    	var tpTaxCode = rec.getLineItemValue('item', 'taxcode', x);
    	        nlapiLogExecution('DEBUG', '3rd party tax code', tpTaxCode);
    			
    			//var thirdPtyAmt = rec.getLineItemValue('item', 'amount', x);
    			
    			//Create Arrays to tally / store Total Amt by Tax Code Information, and which line to write it to
    			if (arrTPtaxCode.indexOf(tpTaxCode) < 0) {
    	          	//nlapiLogExecution('debug', i, '1');
    	          	var indTP = arrTPtaxCode.length || 0;
    	          	nlapiLogExecution('DEBUG', 'indTP', indTP);
    	          	arrTPtaxCode[indTP] = tpTaxCode;
    	          	arrThirdPtyAmt[indTP] = parseFloat(rec.getLineItemValue('item', 'amount', x));
    	          	arrTPLine[indTP] = x;
    	          	continue;
    	        } else {
    	        	//nlapiLogExecution('debug', i, '2');
    	        	var indexTP = arrTPtaxCode.indexOf(tpTaxCode);
    	        	nlapiLogExecution('DEBUG', 'indexTP', indexTP);
    	        	arrThirdPtyAmt[indexTP] += parseFloat(rec.getLineItemValue('item', 'amount', x));
    	        	continue;
    	        }
    			
    			//printAmtTotal = Number(printAmtTotal) + Number(thirdPtyAmt);
    			
    			//if (z == 0){
    				//z = x;
    			//}else{
    				//rec.setLineItemValue('item', 'custcol_print_amount', x, '');
    			//}
    			
    		}//End if (thirdPtyCommItem == 'T')
    		
    	}
    	
    	
    	endUsage = nlapiGetContext().getRemainingUsage();
        nlapiLogExecution('DEBUG', 'End Usage After 3rd Pty Line ' + x, endUsage);
    	
    }//End for x loop
    
    for (var z = 0; z < arrTPtaxCode.length; z++) {

    	nlapiLogExecution('DEBUG', 'Set TP Print Total on Line ' + arrTPLine[z], arrThirdPtyAmt[z]);
    	rec.setLineItemValue('item', 'custcol_print_amount', arrTPLine[z], arrThirdPtyAmt[z]);
    	
    }
    
    //if (z > 0){
    	//rec.setLineItemValue('item', 'custcol_print_amount', z, printAmtTotal);
    //}
    

    nlapiSubmitRecord(rec, false, true);
    
    nlapiLogExecution('DEBUG', 'print_invoice_html LIBRARY', 'FINISH');
    
  }
  catch (err) {
    nlapiLogExecution('error', 'print_invoice_html', JSON.stringify(handleException(err)));
  }

}

function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function handleException(error) {
  var message;

  if (error instanceof nlobjError) {
    message = {
      'code': error.getCode(),
      'details': error.getDetails()
    };
  } else {
    message = {
      'code': 'unexpected error',
      'details': ((typeof error === 'object') ? error.toString() : error)
    };
  }

  return message;
}




function getIncAcctID(incAcct){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'contains', incAcct));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('account', null, filters, columns);
	  
	// Return
	return results;
	
}




/**
 * Returns a list of Sales Orders to be processed with Order Type Segment line level updates
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_upa_getPrintAmtQueueIds(invId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_scg_upa_transaction', null, 'anyof', invId));
	filters.push(new nlobjSearchFilter('custrecord_scg_upa_complete', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_upa_error', null, 'isempty', null));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_scg_upa_transaction', null, null));
	//columns.push(new nlobjSearchColumn('custrecord_scg_prand_trans_type', null, null));
	columns.push(new nlobjSearchColumn('created', null, null).setSort(false /* ascending */));

	return nlapiSearchRecord('customrecord_scg_updprintamount_queue', null, filters, columns);
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}




