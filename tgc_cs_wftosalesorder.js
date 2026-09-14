/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 *
 * Merged Client Script for Sales Order workflow-to-script conversions.
 */
define(['N/ui/dialog'], (dialog) => {
    const FIELD_CUSTOMER = 'entity';
    const FIELD_DNI = 'custbody4';
    const FIELD_PO_CHECK_NUMBER = 'otherrefnum';
    const FIELD_CUSTOMER_PO_REQUIRED = 'custbody_customer_po_required_before_invoicing';

    const CUSTOMER_GMS7971 = 'GMS7971_INTERNAL_ID';

    function pageInit(context) {
        const currentRecord = context.currentRecord;

        updateDniForCustomer(currentRecord);
        showPoRequiredWarning(currentRecord);
    }

    function fieldChanged(context) {
        const currentRecord = context.currentRecord;

        if (context.fieldId === FIELD_CUSTOMER) {
            updateDniForCustomer(currentRecord);
            showPoRequiredWarning(currentRecord);
            return;
        }

        if (context.fieldId === FIELD_PO_CHECK_NUMBER) {
            showPoRequiredWarning(currentRecord);
        }
    }

    function updateDniForCustomer(currentRecord) {
        const customer = currentRecord.getValue({
            fieldId: FIELD_CUSTOMER
        });

        currentRecord.setValue({
            fieldId: FIELD_DNI,
            value: String(customer) === CUSTOMER_GMS7971,
            ignoreFieldChange: true
        });
    }

    function showPoRequiredWarning(currentRecord) {
        const poRequired = currentRecord.getValue({
            fieldId: FIELD_CUSTOMER_PO_REQUIRED
        });

        const poNumber = currentRecord.getValue({
            fieldId: FIELD_PO_CHECK_NUMBER
        });

        if (poRequired === true && !poNumber) {
            dialog.alert({
                title: 'PO Number Required',
                message: 'This customer requires all orders to have a PO number before invoicing. This order does not have one.'
            });
        }
    }

    return {
        pageInit,
        fieldChanged
    };
});
