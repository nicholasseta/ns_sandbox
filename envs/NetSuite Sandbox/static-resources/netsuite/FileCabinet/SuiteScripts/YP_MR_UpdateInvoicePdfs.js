/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @author Chelsea Fagen
 */

define(["N/file", "N/record", "N/runtime", "N/search"],

    function (file, record, runtime, search) {

        /**
         * @description Gets invoice information from transaction record
         *
         * @returns Array | Object | search.Search | mapReduce.ObjectRef | file.File Object
         */
        function getInputData() {

            var invoiceArray = [];

            try {

                var mapReduceScript = runtime.getCurrentScript();

                invoiceArray =  JSON.parse(mapReduceScript.getParameter({
                    name: "custscript_yp_invoicearray"
                }));
                log.debug('invoiceArray', invoiceArray);

            } catch (e) {
                log.error("Script Error", e);
                log.error("mapReduceScript", runtime.getCurrentScript());
            }

            return invoiceArray;
        }

        /**
         * @description Deletes current invoice PDF and sets custbody_yp_pdf to 0 which will trigger user event that creates new invoice PDF
         *
         * @param {*} context
         */
        function map(context) {

            log.debug("enter map context", context);

            try {

                if (!context || !context.value) return;

                var invoiceValues = JSON.parse(context.value);

                var invoiceRecordId = invoiceValues.invoiceRecordId;
                if (!invoiceRecordId) return;

                var invoiceRecordLookup = search.lookupFields({
                    type: search.Type.INVOICE,
                    id: invoiceRecordId,
                    columns: [
                        "custbody_yp_pdf"
                    ]
                });

                var invoicePdfFileId = invoiceRecordLookup ? invoiceRecordLookup.custbody_yp_pdf : null;

                if (invoicePdfFileId) {

                    file.delete({
                        id: invoicePdfFileId
                    });

                }

                record.submitFields({
                    type: record.Type.INVOICE,
                    id: invoiceRecordId,
                    values: {
                        custbody_yp_pdf: 0
                    }
                });

            } catch (e) {
                log.error("Script Error", e);
            }

            log.debug("exit map context", context);

        }

        /**
         * @description Summarizes the output of the previous stages
         *
         * @param {*} summary
         */
        function summarize(summary) {

            var type = summary.toString();

            log.debug(type + ' Usage Consumed', summary.usage);
            log.debug(type + ' Number of Queues', summary.concurrency);
            log.debug(type + ' Number of Yields', summary.yields);

        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
