/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @author Chelsea Fagen, RSM
 */

define(["N/file", "N/search"],

    function (file, search) {

        var PDF_FOLDER = 695;

        var TIME_TO_KEEP_PDF = "tendaysago";

        /**
         * @description Gets all invoices that were already synced to YayPay
         * 
         * @returns Array | Object | search.Search | mapReduce.ObjectRef | file.File Object
         */
        function getInputData() {

            var oldInvoicePdfSearch = null; 

            try {

                oldInvoicePdfSearch = search.create({
                    type: "file",
                    filters: [
                        ["folder", search.Operator.ANYOF, PDF_FOLDER],
                        "AND",
                        ["modified", search.Operator.ONORBEFORE, TIME_TO_KEEP_PDF],
                        "AND",
                        ["filetype", search.Operator.ANYOF, "PDF"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        })
                    ]
                });

                log.debug("oldInvoicePdfSearch", oldInvoicePdfSearch);

            } catch (e) {
                log.error("Script Error", e);
            }

            return oldInvoicePdfSearch;

        }

        /**
         * @description Deletes invoice PDFs from the file cabinet 
         * 
         * @param {*} context 
         */
        function map(context) {

            log.debug("enter map context", context);

            try {

                if (!context || !context.value) return;

                var oldInvoicePdfSearch = JSON.parse(context.value);

                var pdfInvoiceId = oldInvoicePdfSearch.id;

                if (!pdfInvoiceId) return;

                file.delete({
                    id: pdfInvoiceId
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
