/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * Common reusable functions for workflow-to-Sales Order User Event conversion.
 */
define(['N/log', 'N/search', 'N/ui/serverWidget', './tgc_lib'], (log, search, serverWidget, lib) => {
    function isCreate(context) {
        return context.type === context.UserEventType.CREATE;
    }

    function isTruthy(value) {
        return value === true || value === 'T' || value === 'true';
    }

    function toStringValue(value) {
        return value === null || value === undefined ? '' : String(value);
    }

    function getSelectValue(lookupValue) {
        if (Array.isArray(lookupValue) && lookupValue.length) {
            return lookupValue[0].value;
        }

        if (lookupValue && typeof lookupValue === 'object' && lookupValue.value) {
            return lookupValue.value;
        }

        return lookupValue || '';
    }

    function getSelectText(lookupValue) {
        if (Array.isArray(lookupValue) && lookupValue.length) {
            return lookupValue[0].text;
        }

        if (lookupValue && typeof lookupValue === 'object' && lookupValue.text) {
            return lookupValue.text;
        }

        return lookupValue || '';
    }

    function lookupFields(type, id, columns) {
        if (!id) {
            return {};
        }

        return search.lookupFields({
            type,
            id,
            columns
        });
    }

    function lookupCustomerFields(customerId, columns) {
        return lookupFields(search.Type.CUSTOMER, customerId, columns);
    }

    function setBodyValue(transaction, fieldId, value) {
        transaction.setValue({
            fieldId,
            value,
            ignoreFieldChange: true
        });
    }

    function setPendingApproval(transaction, reasonId) {
        setBodyValue(
            transaction,
            lib.FIELDS.TRANSACTION.ORDER_STATUS,
            lib.VALUES.ORDER_STATUS.PENDING_APPROVAL
        );

        if (reasonId) {
            setBodyValue(
                transaction,
                lib.FIELDS.TRANSACTION.PENDING_APPROVAL_REASON,
                reasonId
            );
        }
    }

    function isCylinderOrderType(orderType) {
        const value = toStringValue(orderType);

        return [
            lib.VALUES.ORDER_TYPE.CYLINDER_CHARGE,
            lib.VALUES.ORDER_TYPE.CYLINDER_RENTALS
        ].includes(value);
    }

    function isOneHourApart(firstTime, secondTime) {
        if (!firstTime || !secondTime) {
            return false;
        }

        const first = new Date(firstTime).getTime();
        const second = new Date(secondTime).getTime();

        if (Number.isNaN(first) || Number.isNaN(second)) {
            return false;
        }

        return Math.abs(second - first) === lib.TIME.ONE_HOUR_IN_MS;
    }

    function roundLineQuantities(transaction) {
        const lineCount = transaction.getLineCount({
            sublistId: lib.SUBLISTS.ITEM
        });

        for (let line = 0; line < lineCount; line++) {
            const itemName = transaction.getSublistText({
                sublistId: lib.SUBLISTS.ITEM,
                fieldId: lib.FIELDS.ITEM.ITEM,
                line
            });

            if (lib.EXCLUDED_ITEM_NAMES_FOR_QTY_ROUNDING.includes(itemName)) {
                continue;
            }

            const quantity = transaction.getSublistValue({
                sublistId: lib.SUBLISTS.ITEM,
                fieldId: lib.FIELDS.ITEM.QUANTITY,
                line
            });

            if (!quantity) {
                continue;
            }

            const roundedQuantity = Math.ceil(Number(quantity));

            if (!Number.isFinite(roundedQuantity) || Number(quantity) === roundedQuantity) {
                continue;
            }

            transaction.setSublistValue({
                sublistId: lib.SUBLISTS.ITEM,
                fieldId: lib.FIELDS.ITEM.QUANTITY,
                line,
                value: roundedQuantity
            });
        }
    }

    function hasFgasItem(transaction) {
        const lineCount = transaction.getLineCount({
            sublistId: lib.SUBLISTS.ITEM
        });

        for (let line = 0; line < lineCount; line++) {
            const lineFgasValue = safeGetSublistValue(
                transaction,
                lib.SUBLISTS.ITEM,
                lib.FIELDS.ITEM.FGAS_ITEM,
                line
            );

            if (isTruthy(lineFgasValue)) {
                return true;
            }

            const itemId = transaction.getSublistValue({
                sublistId: lib.SUBLISTS.ITEM,
                fieldId: lib.FIELDS.ITEM.ITEM,
                line
            });

            if (isItemFgas(itemId)) {
                return true;
            }
        }

        return false;
    }

    function safeGetSublistValue(transaction, sublistId, fieldId, line) {
        try {
            return transaction.getSublistValue({
                sublistId,
                fieldId,
                line
            });
        } catch (e) {
            return null;
        }
    }

    function isItemFgas(itemId) {
        if (!itemId) {
            return false;
        }

        try {
            const itemFields = lookupFields(
                search.Type.ITEM || lib.RECORD_TYPES.ITEM,
                itemId,
                [lib.FIELDS.ITEM.FGAS_ITEM]
            );

            return isTruthy(itemFields[lib.FIELDS.ITEM.FGAS_ITEM]);
        } catch (e) {
            log.debug({
                title: 'FGAS item lookup skipped',
                details: {
                    itemId,
                    message: e.message
                }
            });
            return false;
        }
    }

    function disableField(form, fieldId) {
        const field = form.getField({
            id: fieldId
        });

        if (field) {
            field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
        }
    }

    function submitSalesOrderFields(recordModule, salesOrderId, values) {
        if (!salesOrderId || !values || !Object.keys(values).length) {
            return;
        }

        recordModule.submitFields({
            type: recordModule.Type.SALES_ORDER,
            id: salesOrderId,
            values,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
    }

    return {
        isCreate,
        isTruthy,
        toStringValue,
        getSelectValue,
        getSelectText,
        lookupFields,
        lookupCustomerFields,
        setBodyValue,
        setPendingApproval,
        isCylinderOrderType,
        isOneHourApart,
        roundLineQuantities,
        hasFgasItem,
        disableField,
        submitSalesOrderFields
    };
});
