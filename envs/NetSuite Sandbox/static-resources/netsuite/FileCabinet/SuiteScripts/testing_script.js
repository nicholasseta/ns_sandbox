/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/query','N/record'],
    /**
 * @param{query} query
 */
    (query,record) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

            // var sql =
            //     "SELECT " +
            //     "customrecord_contractlines.* " +
            //     "FROM customrecord_contractlines " +
            //     "WHERE customrecord_contractlines.\"ID\" = " + 974849;


            var sql=
            "SELECT " +
            "customrecord_contractlines.ID " +
            "FROM customrecord_contractlines " +
            "WHERE customrecord_contractlines.custrecord_is_cl_source_ext_id = " + 34567;


            var resultSet = query.runSuiteQL({ query: sql }).asMappedResults();

            log.debug('resultSet',resultSet)

        }

        return {execute}

    });
