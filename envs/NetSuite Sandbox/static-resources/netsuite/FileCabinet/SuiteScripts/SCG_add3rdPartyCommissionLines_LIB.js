/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Aug 2018     Doug Humberd     Adds 3rd Party Commission line items to the order on create or when 'Add Commission Lines' button is pushed
 * 1.01       10 Oct 2018     Doug Humberd     Swapped out "product line" values for "location"
 * 1.10       04 Nov 2018     Doug Humberd     Includes "taxcode" when adding 3rd Party Commission line item 
 * 1.20       08 Jan 2019     Doug Humberd     Updated to account for negative commission amounts.  If Commission amount is positive, make negative when adding line item.  If negative, make positive.
 * 1.30       01 Apr 2019     Doug Humberd     Updated - only multiply comm amt by -1 if sales order.  leave as is for Ret Auth
 * 1.40       11 Jun 2019     Doug Humberd     Updated to include changes for new "Quantity for Customer" column
 * 											   Also, if rate/amount is negative, set quantity for customer value to be negative.  If positive, then positive
 * 1.50       09 Aug 2019     Doug Humberd     Updated to not add 3rd Party Commission lines if Commission Amount = 0
 *
 */


/**
 * Adds 3rd Party Commission line items to the order if the item has a Commission Rate value
 *
 * @appliedtorecord salesorder
 *
 * @returns {Void}
 */


function scg_so_set3rdPartyCommissionLines(){
	
	nlapiLogExecution('DEBUG', 'LIB File Running', 'LIB File Running');
	
	//Only run if the 'Customer Bill To' is flagged to be a Partner
	var custBillTo = nlapiGetFieldValue('entity');
	//var isPartner = nlapiLookupField('customer', custBillTo, 'custentity_is_partner');
	if (nlapiLookupField('customer', custBillTo, 'custentity_is_partner') != '2'){//2 = Partner
		nlapiLogExecution('DEBUG', 'Customer ' + custBillTo + ' is Not a Partner', 'Exit');
		return;
	}
	
	//Get the Record Type
	var recType = nlapiGetRecordType();
	nlapiLogExecution('DEBUG', 'Record Type', recType);
	
	var orderType = nlapiGetFieldValue('custbody_so_ordertype');
	var lookupItem = '';
	switch (orderType){
	case '1'://1 = New
		lookupItem = 'custitem_commission_charge_item_new';
		break;
	case '3'://3 = Renewal
		lookupItem = 'custitem_commission_charge_item_renewa';
		break;
	default:
		lookupItem = 'custitem_commission_charge_item_new';
		break;
	}
	
	//nlapiLogExecution('DEBUG', 'Lookup Item', lookupItem);
	
	var itemCount = nlapiGetLineItemCount('item');
	//nlapiLogExecution('DEBUG', 'Count', itemCount);
	
	var quantity = '1';
	var quan4cust = '1';
	
	//Loop through Items to see if any have a Commission Amount.  If found, add the appropriate 3rd Party Commission Item
	for (var i = 1; i <= itemCount; i++){
		
		var item = nlapiGetLineItemValue('item', 'item', i);
		var commAmount = nlapiGetLineItemValue('item', 'custcol_comm_amt', i);
		//nlapiLogExecution('DEBUG', 'Item', item);
		nlapiLogExecution('DEBUG', 'Commission Amount', commAmount);
		
		if (commAmount && commAmount != 0){
			
			nlapiLogExecution('DEBUG', 'Commission Amount != 0 Found', 'Execute Code');
			
			//If commAmount value is negative, change to positive.  If positive, change to negative - ONLY IF NOT a RETURN AUTHORIZATION!
			if (recType != 'returnauthorization'){
				commAmount = commAmount * -1;
				nlapiLogExecution('DEBUG', 'NEW Commission Amount', commAmount);
			}
			
			//If commAmount is negative, change quantity for customer to be negative.  If positive, set as positive
			if (commAmount < 0){
				quan4cust = '-1';
			}else{
				quan4cust = '1';
			}
			nlapiLogExecution('DEBUG', 'Final Quantity for Customer', quan4cust);
			
			//Check the 3rd Party Comm Added field to see if the appropriate line item has been previously added
			var added = nlapiGetLineItemValue('item', 'custcol_scg_3rd_pty_comm_added', i);
			nlapiLogExecution('DEBUG', '3rd Party Added', added);
			
			if (added != 'T'){
				
				//Lookup the appropriate Commission Charge Item on the Item Record
				var commChargeItem = nlapiLookupField('item', item, lookupItem);
				//nlapiLogExecution('DEBUG', 'Commission Charge Item', commChargeItem);
				
				if (commChargeItem){
					nlapiLogExecution('DEBUG', 'Comm Charge Item Found', 'Continue with Code');
					
					//Get relevant line item values
					var taxcode = nlapiGetLineItemValue('item', 'taxcode', i);
					var billSched = nlapiGetLineItemValue('item', 'billingschedule', i);
					var erp = nlapiGetLineItemValue('item', 'class', i);
					var revType = nlapiGetLineItemValue('item', 'custcol_cseg_revenue_type_2', i);
					//var prodLine = nlapiGetLineItemValue('item', 'custcol_cseg_prod_line', i);
					var location = nlapiGetLineItemValue('item', 'location', i);
					var revRecStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
					var revRecEnd = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);
					
					nlapiLogExecution('DEBUG', 'Tax Code', taxcode);
					//nlapiLogExecution('DEBUG', 'Bill Sched', billSched);
					//nlapiLogExecution('DEBUG', 'ERP', erp);
					//nlapiLogExecution('DEBUG', 'Revenue Type', revType);
					//nlapiLogExecution('DEBUG', 'Product Line', prodLine);
					//nlapiLogExecution('DEBUG', 'Rev Rec Start', revRecStart);
					//nlapiLogExecution('DEBUG', 'Rev Rec End', revRecEnd);
					
					//Add New Line Item
					nlapiSelectNewLineItem('item');
					nlapiSetCurrentLineItemValue('item', 'item', commChargeItem, true, true);
					nlapiSetCurrentLineItemValue('item', 'quantity', quantity, true, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_quantity_for_customer', quan4cust, true, true);
					//nlapiSetCurrentLineItemValue('item', 'rate', '-' + commAmount, true, true);
					nlapiSetCurrentLineItemValue('item', 'rate', commAmount, true, true);
					nlapiSetCurrentLineItemValue('item', 'taxcode', taxcode, true, true);
					nlapiSetCurrentLineItemValue('item', 'billingschedule', billSched, true, true);
					nlapiSetCurrentLineItemValue('item', 'class', erp, true, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_cseg_revenue_type_2', revType, true, true);
					//nlapiSetCurrentLineItemValue('item', 'custcol_cseg_prod_line', prodLine, true, true);
					nlapiSetCurrentLineItemValue('item', 'location', location, true, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_start_date', revRecStart, true, true);
					nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_end_date', revRecEnd, true, true);
					nlapiCommitLineItem('item');
					
					nlapiLogExecution('DEBUG', 'Line Item Added', 'Line Item Added');
					
					//Check off 3rd Party Comm Added field so that duplicates aren't added on future saves
					nlapiSetLineItemValue('item', 'custcol_scg_3rd_pty_comm_added', i, 'T');
					
				}
				//else{
					
					//nlapiLogExecution('DEBUG', 'Comm Charge Item NOT Found', 'What happens now??');
				//}
				
			}//end if added = T
			
		}//end if commAmount
		
	}
	nlapiLogExecution('DEBUG', 'Library File End', 'END');
}