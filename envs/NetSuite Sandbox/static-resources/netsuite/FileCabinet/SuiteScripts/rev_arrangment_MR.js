/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/file', 'N/record'], function (file, record) {
    // Use the getInputData function to return two strings.
    function getInputData() {
        var fileData = file.load({
            id: 7652411,
        });
        var revRecData = JSON.parse(fileData.getContents());
        log.debug('REV REC DATA', revRecData);

        return revRecData;
    }

    function map(context) {
        try {
            var data = JSON.parse(context.value);
            log.debug('DATA', data.id);

            var revArrRec = record.load({
                type: 'revenuearrangement',
                id: data.id,
                isDynamic: false,
            });

            revArrRec.setValue({
                fieldId: 'custbody_sfbilling_data_fix',
                value: true,
            });

            var savedRevArr = revArrRec.save();
            log.debug('SAVED REV ARR REC', savedRevArr);
        } catch (err) {
            log.debug('ERROR OCCURED', err);
        }
    }

    function reduce(context) {}

    // The summarize stage is a serial stage, so this function is invoked only one
    // time.
    function summarize(context) {
        // Log details about the script's execution.
        log.debug({
            title: 'Usage units consumed',
            details: context.usage,
        });
        log.debug({
            title: 'Concurrency',
            details: context.concurrency,
        });
        log.debug({
            title: 'Number of yields',
            details: context.yields,
        });

        log.debug('======SCRIPT COMPLETE======');
    }
    // Link each entry point to the appropriate function.
    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize,
    };
});
