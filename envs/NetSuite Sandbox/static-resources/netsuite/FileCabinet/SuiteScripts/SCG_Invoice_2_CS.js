/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     22 Dec 2021     Doug Humberd     Handles Client Events on Invoices
 *                                           Added Logic to Recreate PDF File on button click
 * 
 * 
 */
define(['N/record', 'N/search', 'N/format', 'N/currentRecord', 'N/url'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, format, currentRecord, url) {
	
	const PRINTED_INVOICES = '3224402';//Folder: Printed Invoices
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(context) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(context) {
    	
    	try {
    		//alert('fieldchanged Code');
    	    //is_inv_fieldChangedFunction(context);
    	} catch (e) {
    		is_inv_logError(e);
    	    throw e;
    	}

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(context) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(context) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(context) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(context) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(context) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(context) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(context) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(context) {

    }
    
    
    
    
    
    function is_inv_recreatePdfClicked(){
    	
    	//console.log('Button Clicked');
    	//alert ('Recreate PDF File Clicked...');
    	
    	var currentRec = currentRecord.get();
    	var invId = currentRec.id;
    	//alert ('Invoice Id = ' + invId);
    	
    	var invFields = search.lookupFields({
    	    type: 'invoice',
    	    id: invId,
    	    columns: ['tranid', 'subsidiary']
    	});
    	console.log('Invoice Fields', invFields);
    	
    	var tranId = '';
    	if (!isEmpty(invFields.tranid)){
    		tranId = invFields.tranid;
    	}
    	//alert ('TranId = ' + tranId);
    	console.log('TranId', tranId);
    	
    	var subId = '';
    	if (!isEmpty(invFields.subsidiary)){
    		subId = invFields.subsidiary[0].value;
    	}
    	//alert ('SubId = ' + subId);
    	console.log('SubId', subId);
    	
    	
    	//window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=REJECTION' + '&currentstate=' + currentState + '&inclfiles=NONE&exclfiles=NONE';
    	
    	//var extURL = url.resolveScript({
    	    //scriptId: 'customscript_scg_createpdf_2_sl',
    	    //deploymentId: 'customdeploy_scg_createpdf_2_sl',
    	    //params: {
                //'invid': invId,
                //'tranid': tranId,
                //'subid': subId
            //},
    	    //returnExternalUrl: true
    	//});
    	//console.log(extURL);
    	
    	
    	
    	window.location = url.resolveScript({
    	    scriptId: 'customscript_scg_createpdf_sl',
    	    deploymentId: 'customdeploy_scg_createpdf_sl',
    	    params: {
                'invid': invId,
                'tranid': tranId,
                'subid': subId
            },
    	    returnExternalUrl: true
    	});
    	
    	
    	
    }
    
    
    
    
    
        
    function isEmpty(stValue)
    { 
        if ((stValue == '') || (stValue == null) ||(stValue == undefined))
        {
            return true;
        }
        
        return false;
    }  
    
    
    

    return {
        pageInit: pageInit,
        is_inv_recreatePdfClicked: is_inv_recreatePdfClicked,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});




/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord creditmemo, invoice
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_inv_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		alert(e.toString());
	}
}




