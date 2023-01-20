/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       10 Jul 2020     Doug Humberd     Splits line items if Rev Rec Date range includes 7/1/20 - 12/31/20 dates to use different Tax Codes
 * 1.05       13 Jul 2020     Doug Humberd     Changed to run as beforeSubmit (instead of afterSubmit) to correct issues with other scripts (Print Amount, etc) from not seeing newly added lines
 * 1.06       15 Jul 2020     Doug Humberd     Updated to use Trandate if Rev Rec Start is Empty - so that tax codes will be recalculated
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const PER_START_END_DATE = '7';//Rev Rec Rule
const ONE_WEEK_REV_REC = '11';//Rev Rec Rule
const THREE_WEEK_REV_REC = '10';//Rev Rec Rule

const S_DE = '5569';//CHECK VALUE IN PROD
const S2_DE = '5610';//CHECK VALUE IN PROD



/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_stl_beforeLoad(type, form, request){
    try {
        //is_stl_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_stl_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_stl_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_stl_splitTaxCodeLines(type);
        //is_stl_beforeSubmit(type);
    } catch (e) {
        is_stl_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_stl_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
    	//is_stl_splitTaxCodeLines(type);//MOVED TO beforeSubmit
        //is_stl_afterSubmitFunction(type);
    } catch (e) {
        is_stl_logError(e);
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
function is_stl_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_stl_splitTaxCodeLines(type){
	
	//Only run on create
	//if (type != 'create' && type != 'edit'){//TEMP - CREATE ONLY WHEN RELEASED TO PROD
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'splitTaxCodeLines', 'START');

	var transRec = nlapiGetNewRecord();
	
	var dataMigration = transRec.getFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return;
	}
	
	var createdFrom = transRec.getFieldValue('createdfrom');
	if (!isEmpty(createdFrom)){
		return;
	}
	
	
	var transType = transRec.getRecordType();
	var transId = transRec.getId();
	var customer = transRec.getFieldValue('entity');
	var subsidiary = transRec.getFieldValue('subsidiary');
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');

	
	var shipCountry = transRec.getFieldValue('shipcountry');
	
	
	nlapiLogExecution('DEBUG', 'Trans Type = ' + transType, 'Trans ID = ' + transId);
	nlapiLogExecution('DEBUG', 'Customer', customer);
	nlapiLogExecution('DEBUG', 'Subsidiary = ' + subsidiary, 'Ship Country = ' + shipCountry);
	nlapiLogExecution('DEBUG', 'Subsidiary Country', subCountry);
	nlapiLogExecution('DEBUG', 'Type', type);
	
	
	//******************************************************************************
	//GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY
	//******************************************************************************
		
	//Set Tax Codes if Subsidiary Country = DE (Germany)
	if (subCountry == 'DE'){
		
		if (shipCountry == 'DE'){
			
			var startDate = new Date('7/1/2020');
			var endDate = new Date('1/1/2021');
			nlapiLogExecution('DEBUG', 'Start Date = ' + startDate, 'End Date = ' + endDate);
			
			var lineCount = nlapiGetLineItemCount('item');
			nlapiLogExecution('DEBUG', 'Initial linecount', lineCount);
			
			//SPLIT FIRST BASED ON REV REC RULES
			
			for (var i = 1; i <= lineCount; i++){
				
				var revRecRule = nlapiGetLineItemValue('item', 'custcol_rev_rec_rule', i);
				nlapiLogExecution('DEBUG', 'Rev Rec Rule Line ' + i, revRecRule)
				
				//Only Split if Rev Rev Rule = Per Start & End Date, 1 Week Rev Rec, or 3 Week Rev Rec
				//if (revRecRule != PER_START_END_DATE && revRecRule != ONE_WEEK_REV_REC && revRecRule != THREE_WEEK_REV_REC){
				if (revRecRule != PER_START_END_DATE){//PER JOHN, ONLY CHECK FOR PER START END DATE RR RULE FOR NOW
					nlapiLogExecution('DEBUG', 'WRONG Rev Rec Rule for Split Line ' + i, 'CONTINUE')
					continue;
				}
				
				
				//Get Rev Rec Start / End Date Information
				var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
				var revRecEnd = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);
				var rrdate1 = new Date(revRecStart);
				var rrdate2 = new Date(revRecEnd);
				nlapiLogExecution('DEBUG', 'RevRecStart = ' + rrdate1, 'RevRecEnd = ' + rrdate2);
				
				
				//Determine if Rev Rec Start is within Date Range (7/1/20 - 12/31/20)
				if (rrdate1 >= startDate && rrdate1 < endDate){
					
					nlapiLogExecution('DEBUG', 'RRStart is within Date Range', 'SPLIT');
					
					//If Rev Rec End is also within Date Range, Continue without Split
					if (rrdate2 <= endDate){
						nlapiLogExecution('DEBUG', 'Entire RR Date Range is within Included Range', 'CONTINUE W/O SPLIT');
						continue;
					}
					
					//Calculate the number of days between the Rev Rec Start and Rev Rec End dates
					var diffInRRTime = rrdate2.getTime() - rrdate1.getTime();
					var diffInRRDays = (diffInRRTime / (1000 * 3600 * 24)) + 1;
					diffInRRDays = Math.round(diffInRRDays);
					nlapiLogExecution('DEBUG', 'Num of Days btw RRStart and RREnd line ' + i, diffInRRDays);
					
					//Calculate the number of days between Rev Rec Start and 12/31/20
					var diffInInclTime = endDate.getTime() - rrdate1.getTime();
					var diffInInclDays = diffInInclTime / (1000 * 3600 * 24);
					diffInInclDays = Math.round(diffInInclDays);
					nlapiLogExecution('DEBUG', 'Num of Days btw RRStart and 12/31/20 line ' + i, diffInInclDays);
					
					//Calculate the number of 'not included' days
					var daysNotIncl = diffInRRDays - diffInInclDays;
					nlapiLogExecution('DEBUG', 'Num of Days outside of Date Range line ' + i, daysNotIncl);
					
					
					//Calculate New Quantity Values (for original line and for new line)
					var qty = nlapiGetLineItemValue('item', 'quantity', i);
					nlapiLogExecution('DEBUG', 'Quantity line ' + i, qty);
					var newQty = (qty / diffInRRDays) * diffInInclDays
					nlapiLogExecution('DEBUG', 'New Quantity line ' + i, newQty);
					newQty = newQty.toFixed(5);
					nlapiLogExecution('DEBUG', 'ROUNDED New Quantity line ' + i, newQty);
					var splitQty = qty - newQty;
					nlapiLogExecution('DEBUG', 'Split Quantity line ' + i, splitQty);
					splitQty = splitQty.toFixed(5);
					nlapiLogExecution('DEBUG', 'ROUNDED Split Quantity line ' + i, splitQty);
					
					//Get existing line item values
					var proj = nlapiGetLineItemValue('item', 'job', i);
					var item = nlapiGetLineItemValue('item', 'item', i);
					var desc = nlapiGetLineItemValue('item', 'description', i);
					var rate = nlapiGetLineItemValue('item', 'rate', i);
					var taxCode = nlapiGetLineItemValue('item', 'taxcode', i);
					var billSched = nlapiGetLineItemValue('item', 'billingschedule', i);
					var erp = nlapiGetLineItemValue('item', 'class', i);
					var erpVersion = nlapiGetLineItemValue('item', 'custcol_erp_version', i);
					var prodLine = nlapiGetLineItemValue('item', 'custcol_product_family', i);
					var businessLine = nlapiGetLineItemValue('item', 'custcol_so_business_line', i);
					var svcType = nlapiGetLineItemValue('item', 'custcol_service_type', i);
					var delType = nlapiGetLineItemValue('item', 'custcol_delivery_type', i);
					var satisClauseReq = nlapiGetLineItemValue('item', 'custcol_satisfaction_clause_required', i);
					var commRate = nlapiGetLineItemValue('item', 'custcol_so_commrate', i);
					var commAmt = nlapiGetLineItemValue('item', 'custcol_comm_amt', i);
					var thirdPtyCommAdded = nlapiGetLineItemValue('item', 'custcol_scg_3rd_pty_comm_added', i);
					var discPct = nlapiGetLineItemValue('item', 'custcol_discount_precent', i);
					
					nlapiLogExecution('DEBUG', 'Project', proj);
					nlapiLogExecution('DEBUG', 'Item', item);
					nlapiLogExecution('DEBUG', 'Description', desc);
					nlapiLogExecution('DEBUG', 'Rate', rate);
					nlapiLogExecution('DEBUG', 'Tax Code', taxCode);
					nlapiLogExecution('DEBUG', 'Bill Sched', billSched);
					nlapiLogExecution('DEBUG', 'ERP', erp);
					nlapiLogExecution('DEBUG', 'ERP Version', erpVersion);
					nlapiLogExecution('DEBUG', 'Product Line', prodLine);
					nlapiLogExecution('DEBUG', 'Business Line', businessLine);
					nlapiLogExecution('DEBUG', 'Service Type', svcType);
					nlapiLogExecution('DEBUG', 'Delivery Type', delType);
					nlapiLogExecution('DEBUG', 'Satisfaction Clause Req', satisClauseReq);
					nlapiLogExecution('DEBUG', 'Commission Rate', commRate);
					nlapiLogExecution('DEBUG', 'Commission Amt', commAmt);
					nlapiLogExecution('DEBUG', '3rd Party Comm Added', thirdPtyCommAdded);
					nlapiLogExecution('DEBUG', 'Discount %', discPct);
					
					
					//Calculate New Commission Amount Values (for original line and for new line)
					if (commAmt){
						var newCommAmt = (commAmt / diffInRRDays) * diffInInclDays
						nlapiLogExecution('DEBUG', 'New Comm Amt line ' + i, newCommAmt);
						newCommAmt = newCommAmt.toFixed(2);
						nlapiLogExecution('DEBUG', 'ROUNDED New Comm Amt line ' + i, newCommAmt);
						var splitCommAmt = commAmt - newCommAmt;
						nlapiLogExecution('DEBUG', 'Split Comm Amt line ' + i, splitCommAmt);
						splitCommAmt = splitCommAmt.toFixed(2);
						nlapiLogExecution('DEBUG', 'ROUNDED Split Comm Amt line ' + i, splitCommAmt);
					}else{
						var newCommAmt = '';
						var splitCommAmt = '';
					}
					
					
					//Update values on existing line
					nlapiSelectLineItem('item', i);
					nlapiSetCurrentLineItemValue('item', 'quantity', newQty);
					nlapiSetCurrentLineItemValue('item', 'custcol_quantity_for_customer', newQty);
					nlapiSetCurrentLineItemValue('item', 'custcol_comm_amt', newCommAmt);
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_start_date', revRecStart);
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_end_date', '12/31/2020');
					nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', revRecStart);
					nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', '12/31/2020');
					nlapiCommitLineItem('item');
					
					
					//Create New Line
					nlapiSelectNewLineItem('item');
					nlapiSetCurrentLineItemValue('item', 'job', proj);
					nlapiSetCurrentLineItemValue('item', 'item', item);
					nlapiSetCurrentLineItemValue('item', 'quantity', splitQty);
					nlapiSetCurrentLineItemValue('item', 'custcol_quantity_for_customer', splitQty);
					nlapiSetCurrentLineItemValue('item', 'description', desc);
					nlapiSetCurrentLineItemValue('item', 'rate', rate);
					nlapiSetCurrentLineItemValue('item', 'taxcode', taxCode);
					nlapiSetCurrentLineItemValue('item', 'billingschedule', billSched);
					nlapiSetCurrentLineItemValue('item', 'class', erp);
					nlapiSetCurrentLineItemValue('item', 'custcol_erp_version', erpVersion);
					nlapiSetCurrentLineItemValue('item', 'custcol_product_family', prodLine);
					nlapiSetCurrentLineItemValue('item', 'custcol_so_business_line', businessLine);
					nlapiSetCurrentLineItemValue('item', 'custcol_service_type', svcType);
					nlapiSetCurrentLineItemValue('item', 'custcol_delivery_type', delType);
					nlapiSetCurrentLineItemValue('item', 'custcol_satisfaction_clause_required', satisClauseReq);
					nlapiSetCurrentLineItemValue('item', 'custcol_so_commrate', commRate);
					nlapiSetCurrentLineItemValue('item', 'custcol_comm_amt', splitCommAmt);
					nlapiSetCurrentLineItemValue('item', 'custcol_scg_3rd_pty_comm_added', thirdPtyCommAdded);
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_start_date', '1/1/2021');
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_end_date', revRecEnd);
					nlapiSetCurrentLineItemValue('item', 'custcol_term_start_date', '1/1/2021');
					nlapiSetCurrentLineItemValue('item', 'custcol_term_end_date', revRecEnd);
					nlapiSetCurrentLineItemValue('item', 'custcol_discount_precent', discPct);

					nlapiCommitLineItem('item');

					
				}else{//Rev Rec Start is NOT within Date Range (7/1/20 - 12/31/20)

					nlapiLogExecution('DEBUG', 'RRStart is outside of Date Range', 'CONTINUE W/O SPLIT');
					continue;
					
				}
				
			}//End for i loop
			
			//nlapiSubmitRecord(transactionRec);
			
			
			//RESET TAX CODES ON ALL LINES BASED ON REV REC START DATE
			
			
			var lineCount2 = nlapiGetLineItemCount('item');
			nlapiLogExecution('DEBUG', 'NEW line count', lineCount2);
			
			for (var x = 1; x <= lineCount2; x++){
				
				var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
				nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
				if (taxItem == 'T'){
					nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
					continue;
				}
				
				var updRRStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', x);
				
				//If Rev Rec Start is Empty, use transaction date
				if (isEmpty(updRRStart)){
					updRRStart = nlapiGetFieldValue('trandate');
					nlapiLogExecution('DEBUG', 'Rev Rec Start Empty - Use Trandate ' + updRRStart, 'USE TRANDATE')
				}
				
				var rrStartObj = new Date(updRRStart);
				nlapiLogExecution('DEBUG', 'Updated RR Start Line ' + x, rrStartObj);
				nlapiLogExecution('DEBUG', 'start date: ' + startDate, 'end date: ' + endDate);
				
				if (rrStartObj >= startDate && rrStartObj < endDate){
					var variableTaxCode = S2_DE;
					nlapiLogExecution('DEBUG', 'Set Tax Code Line ' + x, 'S2_DE');
				}else{
					var variableTaxCode = S_DE;
					nlapiLogExecution('DEBUG', 'Use Original Tax Code', 'S_DE');
				}
				
				
				nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode);
				
			}//End for x loop
			
		}//End if (shipCountry == 'DE')
		
	}//End if (subCountry == 'DE')
	
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}   




