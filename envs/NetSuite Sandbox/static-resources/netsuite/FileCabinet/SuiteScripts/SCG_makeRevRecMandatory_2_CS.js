/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     19 Nov 2020     Doug Humberd     Does Not Allow Save if Rev Rec Dates are Missing, for certain Rev Rec Rules
 
 * 
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	
	const PER_START_END_DATE = '7';//Rev Rec Rule: Per Start & End Date
	const LICENSE = '8';//Rev Rec Rule: License
    
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
    	
    	try {
    	    var retVal = is_mrrm_makeRevRecMandatory(context);
    	    //retVal = (retVal) ? mri_vbal_saveRecordFunction() : false;
    	    //retVal = (retVal) ? mri_vbal_saveRecordFunction() : false;
    	    return retVal;
    	} catch (e) {
    	    is_mrrm_logError(e);
    	    throw e;
    	}

    }
    
    
    
    
    
    function is_mrrm_makeRevRecMandatory(context){
    	
    	var retVal = true;
    	
    	//alert ('makeRevRecMandatory running');
    	
    	var transRec = context.currentRecord;
    	var recType = transRec.type;
    	//alert('recType = ' + recType);
    	
    	//Only Run in Create Mode
    	if (recType == 'invoice' || recType == 'creditmemo'){
    		
    		var orderNum = transRec.getValue({
        	    fieldId: 'tranid'
        	});
        	//alert ('Order# = ' + orderNum);
        	
        	if (orderNum != 'To Be Generated'){
        		//alert ('Edit Mode - Do Not Run Script');
        		//retVal = false;//TEMP
        		retVal = true;
            	return retVal;
        	}
    		
    	}
    	
    	var itemCount = transRec.getLineCount({
    	    sublistId: 'item'
    	});
    	
    	for (var i = 0; i < itemCount; i++){
    		
    		var revRecRule = transRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_rev_rec_rule',
			    line: i
			});
    		
    		var revRecStart = transRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_rev_rec_start_date',
			    line: i
			});
    		
    		var revRecEnd = transRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_rev_rec_end_date',
			    line: i
			});
    		
    		if (revRecRule == PER_START_END_DATE && (isEmpty(revRecStart) || isEmpty(revRecEnd))){
    			
    			alert('*** UNABLE TO SAVE ***\n\nBoth Rev Rec Start and Rev Rec End Dates are required when\nRev Rec Rule = Per Start & End Date.\n\nPlease enter appropriate values before resaving.\n');
				
				retVal = false;
		    	return retVal;
    			
    		}
    		
    		if (revRecRule == LICENSE && isEmpty(revRecStart)){
    			
    			alert('*** UNABLE TO SAVE ***\n\nRev Rec Start Date is required when\nRev Rec Rule = License.\n\nPlease enter appropriate values before resaving.\n');
				
				retVal = false;
		    	return retVal;
    			
    		}
    		
    	}//End for i loop
    	
    	
    	//retVal = false;//TEMP
    	//return retVal;//TEMP
    	
    	retVal = true;
    	return retVal;
    	
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
        //pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        saveRecord: saveRecord
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
function is_mrrm_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		alert(e.toString());
	}
}




