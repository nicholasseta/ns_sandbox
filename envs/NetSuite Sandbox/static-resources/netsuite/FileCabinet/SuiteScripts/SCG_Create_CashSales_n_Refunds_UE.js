/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Oct 2018     Doug Humberd	   After Submit script that runs on custom record type 'Cash Sales and Refunds' to create either Cash Sale or Cash Refund Records
 * 1.10       30 Nov 2018     Doug Humberd     Updated to include Posting Period and Tax Code values - also changed Account from '461' to '116'
 *
 */

/**
 * Constants
 *
 */
//const ORDER_TYPE = '1';//1 = "Contract - New"
//const ITEM = '155';//155 = Braintree B2C 
const ITEM_QTY = 1;
//const ACCOUNT = '461';//14010 Clearing Accounts: Undeposited Funds
const ACCOUNT = '116';//Undeposited Funds

/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function is_csr_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * Performs actions immediately before a write event on a record.
 * 
 * @appliedtorecord customrecord_scg_cash_sales_refunds
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_csr_afterSubmit(type) {
	try {
		is_csr_createCashSaleOrRefund(type);
	} catch (e) {
		is_csr_logError(e);
		throw e;
	}
}



/**
 * Performs actions immediately before a write event on a record.
 * 
 * @appliedtorecord Cash Sales and Refunds
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_csr_createCashSaleOrRefund(type){
	try {
		// Initialize variables
        var csrRec = nlapiGetNewRecord();
        var complete = csrRec.getFieldValue('custrecord_scg_csr_complete');
        
        //Don't run if Complete field is checked
        if (complete == 'T'){
        	nlapiLogExecution('DEBUG', 'Complete is checked', complete);
        	return;
        }
        
        //Get Body values
        var csrCustomer = csrRec.getFieldValue('custrecord_scg_csr_customer');
        //var csrAccount = csrRec.getFieldValue('custrecord_scg_csr_account');
        var csrCurrency = csrRec.getFieldValue('custrecord_scg_csr_currency');
        var csrExchRate = csrRec.getFieldValue('custrecord_scg_csr_exch_rate');
        var csrDate = csrRec.getFieldValue('custrecord_scg_csr_date');
        var csrPostPd = csrRec.getFieldValue('custrecord_scg_csr_posting_period');
        nlapiLogExecution('DEBUG', 'csr Posting Period', csrPostPd);
        var csrMemo = csrRec.getFieldValue('custrecord_scg_csr_memo');
        var csrCheckNum = csrRec.getFieldValue('custrecord_scg_csr_check_number');
        
        var csrSubsidiary = csrRec.getFieldValue('custrecord_scg_csr_subsidiary');
        
        var csrOrderType = csrRec.getFieldValue('custrecord_scg_csr_order_type');
        var csrPartner = csrRec.getFieldValue('custrecord_scg_csr_partner_reseller');
        var csrEndUser = csrRec.getFieldValue('custrecord_scg_csr_end_user');
        
        //Determine Bill To Address based on Bill Country Value
        //var csrBillCntry = csrRec.getFieldText('custrecord_csr_bill_country');
        //var addrId;
        //var custRec = nlapiLoadRecord('customer', csrCustomer);
        //var count = custRec.getLineItemCount('addressbook');
        //for (var i = 1; i <= count; i++){
        	
        	//var addrLabel = custRec.getLineItemValue('addressbook', 'label', i);
        	//if (addrLabel === csrBillCntry){
        		//nlapiLogExecution('DEBUG', 'Address Record: ' + addrLabel, 'Bill Country: ' + csrBillCntry);
        		//addrId = custRec.getLineItemValue('addressbook', 'addressid', i);
        	//}
        	
        //}
        
        //if (addrId == null || addrId == ''){
        	//nlapiLogExecution('ERROR', 'Unable to Identify the Address Record. (' + csrBillCntry + ')', 'Validate against the Address Records in the Customer Record.');
        //}
        
        //Get Item values
        var csrItem = csrRec.getFieldValue('custrecord_scg_csr_item');
        var csrRate = csrRec.getFieldValue('custrecord_scg_csr_line_amount');
        csrRate = (csrRate < 0) ? csrRate * -1 : csrRate;//If negative, convert Rate to positive
        var csrTaxCode = csrRec.getFieldValue('custrecord_scg_csr_tax_code');
        nlapiLogExecution('DEBUG', 'csr Tax Code', csrTaxCode);
        var csrERP = csrRec.getFieldValue('custrecord_scg_csr_erp');
        var csrRevRecStart = csrRec.getFieldValue('custrecord_scg_csr_rev_rec_start_date');
        var csrRevRecEnd = csrRec.getFieldValue('custrecord_scg_csr_rev_rec_end_date');
        //var csrGrossCC = csrRec.getFieldValue('custrecord_csr_grs_cc_amt');
        //csrGrossCC = (csrGrossCC < 0) ? csrGrossCC * -1 : csrGrossCC;//If negative, convert Gross CC Amt to positive
        var csrTranId;
        
        //Determine if creating a Cash Sale or Cash Refund record (> 0.00, Cash Sale.  < 0.00, Cash Refund.  0.00, Exit
        var itemAmt = csrRec.getFieldValue('custrecord_scg_csr_line_amount');
        nlapiLogExecution('DEBUG', 'Item Amount', itemAmt);
        
        if (itemAmt == 0){//If Amount = 0, Exit
        	nlapiLogExecution('DEBUG', 'Amount = 0', 'EXIT');
        	return;
        }
        
        if (itemAmt > 0){//Create Cash Sale Record
        	nlapiLogExecution('DEBUG', 'Create Cash Sale Record', 'Amount = ' + itemAmt);
        	
            var csTranRec = nlapiCreateRecord('cashsale', {recordmode: 'dynamic'});
            
            //Set Body fields
            //csTranRec.setFieldValue('custbody_end_user', csrCustomer);
            csTranRec.setFieldValue('entity', csrCustomer);
            csTranRec.setFieldValue('subsidiary', csrSubsidiary);
            csTranRec.setFieldValue('trandate', csrDate);
            //csTranRec.setFieldValue('postingperiod', csrPostPd);
            csTranRec.setFieldValue('otherrefnum', csrCheckNum);
            csTranRec.setFieldValue('memo', csrMemo);
            //csTranRec.setFieldValue('billaddresslist', addrId);
            //csTranRec.setFieldValue('paymentmethod', csrPayMthd);
            csTranRec.setFieldValue('custbody_so_ordertype', csrOrderType);
            
            if(csrCurrency != null){
            	csTranRec.setFieldValue('currency', csrCurrency);
            }
            
            csTranRec.setFieldValue('exchangerate', csrExchRate);
            csTranRec.setFieldValue('custbody_partnerjvreseller', csrPartner);
            csTranRec.setFieldValue('custbody_so_enduser', csrEndUser);
            
            
            //Undeposited Funds (14010 - Hardcode)
            //csTranRec.setFieldValue('account', csrAccount);
            
            // Add items to item sublist
            csTranRec.selectNewLineItem('item');
            csTranRec.setCurrentLineItemValue('item', 'item', csrItem);
            csTranRec.setCurrentLineItemValue('item', 'quantity', ITEM_QTY);
            csTranRec.setCurrentLineItemValue('item', 'description', csrMemo);
            csTranRec.setCurrentLineItemValue('item', 'rate', csrRate);
            csTranRec.setCurrentLineItemValue('item', 'taxcode', csrTaxCode);
            csTranRec.setCurrentLineItemValue('item', 'class', csrERP);
            //csTranRec.setCurrentLineItemValue('item', 'custcol_gross_cc_amt', csrGrossCC);
            
            if(csrRevRecStart != null){
            	csTranRec.setCurrentLineItemValue('item', 'custcol_rev_rec_start_date', csrRevRecStart);
            }
            
            if(csrRevRecEnd != null){
            	csTranRec.setCurrentLineItemValue('item', 'custcol_rev_rec_end_date', csrRevRecEnd);
            }
            
            csTranRec.commitLineItem('item');
            
            //csTranRec.setFieldValue('account', csrAccount);

            //Submit New Cash Sale Record
            csrTranId = nlapiSubmitRecord(csTranRec, true, true);
            
            //Update the Posting Period field after the Record has been submitted
            nlapiSubmitField('cashsale', csrTranId, 'postingperiod', csrPostPd);
        	
        }
        else{//Create Cash Refund Record
        	nlapiLogExecution('DEBUG', 'Create Cash Refund Record', 'Amount = ' + itemAmt);
        	
            var crTranRec = nlapiCreateRecord('cashrefund', {recordmode: 'dynamic'});
            
            //Set Body fields
            crTranRec.setFieldValue('entity', csrCustomer);
            crTranRec.setFieldValue('subsidiary', csrSubsidiary);
            crTranRec.setFieldValue('trandate', csrDate);
            //crTranRec.setFieldValue('postingperiod', csrPostPd);
            crTranRec.setFieldValue('otherrefnum', csrCheckNum);
            crTranRec.setFieldValue('memo', csrMemo);
            //crTranRec.setFieldValue('subsidiary', csrSubsidiary);
            crTranRec.setFieldValue('custbody_so_ordertype', csrOrderType);
            //crTranRec.setFieldValue('custbody_end_user', csrCustomer);
            //crTranRec.setFieldValue('paymentmethod', csrPayMthd);
            //crTranRec.setFieldValue('billaddresslist', addrId);
            
            if(csrCurrency != null){
            	crTranRec.setFieldValue('currency', csrCurrency);
            }
            crTranRec.setFieldValue('account', ACCOUNT);
            crTranRec.setFieldValue('exchangerate', csrExchRate);
            crTranRec.setFieldValue('custbody_partnerjvreseller', csrPartner);
            crTranRec.setFieldValue('custbody_so_enduser', csrEndUser);

            //Fields defaulting to NO
            crTranRec.setFieldValue('toprint2', 'F');
            crTranRec.setFieldValue('refundcheck', 'F');
        	
            // Add items to item sublist
            crTranRec.selectNewLineItem('item');
            crTranRec.setCurrentLineItemValue('item', 'item', csrItem);
            crTranRec.setCurrentLineItemValue('item', 'quantity', ITEM_QTY);
            crTranRec.setCurrentLineItemValue('item', 'description', csrMemo);
            crTranRec.setCurrentLineItemValue('item', 'rate', csrRate);
            crTranRec.setCurrentLineItemValue('item', 'taxcode', csrTaxCode);
            crTranRec.setCurrentLineItemValue('item', 'class', csrERP);
            //crTranRec.setCurrentLineItemValue('item', 'custcol_gross_cc_amt', csrGrossCC);
            
            if(csrRevRecStart != null){
            	crTranRec.setCurrentLineItemValue('item', 'custcol_rev_rec_start_date', csrRevRecStart);
            }
            
            if(csrRevRecEnd != null){
            	crTranRec.setCurrentLineItemValue('item', 'custcol_rev_rec_end_date', csrRevRecEnd);
            }
            
            crTranRec.commitLineItem('item');

            // Submit New Cash Refund Record
            csrTranId = nlapiSubmitRecord(crTranRec);
            
            //Update the Posting Period field after the Record has been submitted
            nlapiSubmitField('cashrefund', csrTranId, 'postingperiod', csrPostPd);
        	
        }
        
        // Update custom record
       	nlapiSubmitField('customrecord_scg_cash_sales_refunds', nlapiGetRecordId(), ['custrecord_scg_csr_complete', 'custrecord_scg_csr_cashsale_or_refund'], ['T', csrTranId]);

       	
	} catch(e) {
        var errorMessage = '';
		if (e instanceof nlobjError) {
			errorMessage = e.getCode() + '\n' + e.getDetails();
			nlapiLogExecution( 'DEBUG', 'System Error', errorMessage );
		} else {
			errorMessage = e.toString();
			nlapiLogExecution( 'DEBUG', 'Unexpected Error', errorMessage );
		}
		// Record the error on the Customer Refund Processing Queue record
		nlapiSubmitField('customrecord_scg_cash_sales_refunds', nlapiGetRecordId(), 'custrecord_scg_csr_error', errorMessage);
	}
	
}

