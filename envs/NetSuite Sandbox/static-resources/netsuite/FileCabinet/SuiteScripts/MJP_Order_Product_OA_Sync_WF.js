/**
 * @NApiVersion 2.0
 * @NScriptType WorkflowActionScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     18 Jan 2022     Matt Poloni      Checks the "Send to OpenAir" checkbox on Order Products
 * 
 */

define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
	function (record, search) {
		function onAction(context) {
			try {
				sendOPtoOA(context);
			} catch (e) {
				logError(e);
			}
		}




		function sendOPtoOA(context) {
			log.debug('Script start', 'START')
			var newRecord = context.newRecord;
			var recordID = newRecord.id;

			// Lookup necessary filter field by record type
			var recordType = newRecord.type;
			log.debug('Record Type', recordType);
			var fieldByRecordType = {
				'job': 'custrecord_is_cl_job'
			}
			var filterField = fieldByRecordType[recordType];
			log.debug('Filter field by record type', filterField);
			if (filterField == undefined) {
				log.debug(recordType + ' record type is unsupported', 'EXIT');
				return;
			}
			
			// Create search of Order Products by record ID
			var searchresults = search.create({
				type: 'customrecord_contractlines',
				columns: [
					search.createColumn({
						name: 'internalid'
					})
				],
				filters: [
					[filterField, 'anyof', recordID]
				]
			});
			
			// Run search and check for results
			var result = searchresults.run();
			var resultRange = result.getRange({
				start: 0,
				end: 1000
			});
			var resultLength = resultRange.length;
			log.debug('Search Result Length', resultLength);
			if (resultLength == 0) {
				log.debug('No Order Product Records found for project ' + recordID, 'EXIT');
				return;
			}
			
			// Update each related Order Product
			var opId;
			for (var i = 0; resultLength > 0 && i < resultLength; i++) {
			
				opId = resultRange[i].getValue({
					name: 'internalid'
				});
				log.debug('Order Product ID result ' + i, opId);
			
			
				var ordProdId = record.submitFields({
					type: 'customrecord_contractlines',
					id: opId,
					values: {
						'custrecord1': true
					}
				});
				log.debug('Fields submitted for result ' + i, ordProdId);
			}

			log.debug('Script finished successfully', 'END')
		}




		return {
			onAction: onAction
		};
	}
);



function logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}