/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	try{

			return{
				type:'search',
				id:'customsearch_project_missing'
			}

		}catch(e){
			log.error({
				title 	: 'ERROR OCCURRED',
				details : e.toString()
			});
		}

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	try{
    		var valueObj = JSON.parse(context.value);    
    		log.debug('In Map',valueObj);
    		var orderProdID = valueObj.values['internalid'].value;
    		if(orderProdID){
    			var recObj = record.load({
					type: 'customrecord_contractlines',
					id: orderProdID,
					isDynamic: false,
				});
    			var recID = recObj.save();
    			log.debug('Record Saved',recID);
    		}
    	}catch(e){
    		log.error({
				title 	: 'ERROR OCCURRED',
				details : e.toString()
			});
    	}
    	
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
