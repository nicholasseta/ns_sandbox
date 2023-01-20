/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Dec 2019     Doug Humberd     Adds Allocation line items to the order on create
 * 1.05       29 May 2020     Doug Humberd     Updated to only add one allocation item.  Once added, stop processing.
 *
 */


/**
 * Adds Allocation line items to the order on create
 *
 * @appliedtorecord salesorder
 *
 * @returns {Void}
 */


function scg_so_addAllocationItems(){
	
	nlapiLogExecution('DEBUG', 'Allocation LIB File Running', 'Allocation LIB File Running');
	
	var quantity;
	var qtyForCust;
	var amount = '0';
	var billSched;
	var erp;
	var erpVersion;
	var prodLine;
	var rrStart;
	var rrEnd;
	var prodFamily;
	
	var itemCount = nlapiGetLineItemCount('item');
	
	for (var i = 1; i <= itemCount; i++){
		
		var item = nlapiGetLineItemValue('item', 'item', i);
		var allocationItem = nlapiLookupField('item', item, 'custitem_allocation_item');
		
		if (allocationItem){
			
			quantity = nlapiGetLineItemValue('item', 'quantity', i);
			qtyForCust = nlapiGetLineItemValue('item', 'custcol_quantity_for_customer', i);
			billSched = nlapiGetLineItemValue('item', 'billingschedule', i);
			erp = nlapiGetLineItemValue('item', 'class', i);
			erpVersion = nlapiGetLineItemValue('item', 'custcol_erp_version', i);
			prodLine = nlapiGetLineItemValue('item', 'location', i);
			rrStart = nlapiGetLineItemValue('item', 'custcol_rev_rec_start_date', i);
			rrEnd = nlapiGetLineItemValue('item', 'custcol_rev_rec_end_date', i);
			prodFamily = nlapiGetLineItemValue('item', 'custcol_product_family', i);
			
			//nlapiLogExecution('DEBUG', 'Quantity', quantity);
			//nlapiLogExecution('DEBUG', 'Quantity for Customer', qtyForCust);
			//nlapiLogExecution('DEBUG', 'Bill Sched', billSched);
			//nlapiLogExecution('DEBUG', 'ERP', erp);
			//nlapiLogExecution('DEBUG', 'ERP Version', erpVersion);
			//nlapiLogExecution('DEBUG', 'Product Line', prodLine);
			//nlapiLogExecution('DEBUG', 'Rev Rec Start', rrStart);
			//nlapiLogExecution('DEBUG', 'Rev Rec End', rrEnd);
			//nlapiLogExecution('DEBUG', 'Product Family', prodFamily);
			
			//Add New Line Item
			nlapiSelectNewLineItem('item');
			nlapiSetCurrentLineItemValue('item', 'item', allocationItem, true, true);
			nlapiSetCurrentLineItemValue('item', 'quantity', quantity, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_quantity_for_customer', qtyForCust, true, true);
			nlapiSetCurrentLineItemValue('item', 'rate', amount, true, true);
			//nlapiSetCurrentLineItemValue('item', 'taxcode', taxcode, true, true);
			nlapiSetCurrentLineItemValue('item', 'billingschedule', billSched, true, true);
			nlapiSetCurrentLineItemValue('item', 'class', erp, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_erp_version', erpVersion, true, true);
			nlapiSetCurrentLineItemValue('item', 'location', prodLine, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_start_date', rrStart, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_rev_rec_end_date', rrEnd, true, true);
			nlapiSetCurrentLineItemValue('item', 'custcol_product_family', prodFamily, true, true);
			nlapiCommitLineItem('item');
			
			nlapiLogExecution('DEBUG', 'Allocation Line Item Added', 'Allocation Line Item Added');
			
			nlapiLogExecution('DEBUG', 'End Allocation Library File after Line ' + i, 'BREAK');
			break;
			
		}
		
	}//End for i loop
	
	nlapiLogExecution('DEBUG', 'Allocation Library File End', 'END');

}