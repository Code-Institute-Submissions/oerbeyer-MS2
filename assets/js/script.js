$('document').ready(function () {

    // Listen for key press enter to trigger layer cost calculations.
    $('input').keypress(function (event) {
        console.log("Enter Key Press");
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            var analysis = $(this).closest('.analysis');
            SetAllLayersCost(analysis);
        }
    });

    // Listen for change to method selection.
    $('input[name="method"]').change(function () {
        console.log("Method Change");
        var analysis = $(this).closest('.analysis');
        
        // Show/Hide methods.
        if ($(this).val() === "0") {
            analysis.find('.method-inputs-baserate').show();
            analysis.find('.method-inputs-frequency').hide();
        } else if ($(this).val() === "1") {
            analysis.find('.method-inputs-baserate').hide();
            analysis.find('.method-inputs-frequency').show();
        }
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for click on add layer buttons.
    $('.layer-buttons-add').click(function () {
        console.log("Add layer button click");

        // Add new layer with new excess layer = old layer limit + old layer excess.
        var oldLayer = $(this).closest('.layer-area').find('tbody tr').last();
        oldLayer.clone(true).appendTo(oldLayer.parent());
        var newLayer = oldLayer.next();
        var newExcess = parseFloat(oldLayer.find('.layer-limit input').val()) + parseFloat(oldLayer.find('.layer-excess input').val());
        newLayer.find('.layer-excess input').val(newExcess);
        
        // Calculate new layer cost.
        SetLayerCost(newLayer);
    });

    // Listen for click on remove layer buttons.
    $('.layer-buttons-remove').click(function () {
        console.log("Remove layer button click");

        // Remove layer when there is more than one layer.
        var layer = $(this).closest('.layer-area').find('tbody tr').last();
        if (layer.siblings().length > 0) {
            layer.remove();
        }
    });

    // Listen for change to ilf scale parameter.
    $('.method-inputs-ilf input[name="ilfScale"]').change(function () {
        console.log("ILF Scale Change");
        var analysis = $(this).closest('.analysis');
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to ilf shape parameter.
    $('.method-inputs-ilf input[name="ilfShape"]').change(function () {
        console.log("ILF Shape Change");
        var analysis = $(this).closest('.analysis');
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to rate for base rate + ilf method.
    $('.method-inputs-baserate input[name="rate"]').change(function () {
        console.log("Base Rate Change");
        var analysis = $(this).closest('.analysis');
        var name = $(this).attr('name');
        var layer = analysis.find('.method-area tbody tr');
        
        // Convert base rate to base cost and calculate layer costs.
        ConvertRateAndCost(layer, name);
        SetAllLayersCost(analysis);
    });

    // Listen for change to rate for base rate + ilf method.
    $('.method-inputs-baserate input[name="cost"]').change(function () {
        console.log("Base Rate Change");
        var analysis = $(this).closest('.analysis');
        var name = $(this).attr('name');
        var layer = analysis.find('.method-area tbody tr');
        
        // Convert base cost to base rate and calculate layer costs.
        ConvertRateAndCost(layer, name);
        SetAllLayersCost(analysis);
    });

    // Listen for change to limit for base rate + ilf method.
    $('.method-inputs-baserate input[name="limit"]').change(function () {
        console.log("Base Limit Change");
        var analysis = $(this).closest('.analysis');
        var layer = analysis.find('.method-area tbody tr');
        
        // Convert base cost to base rate and calculate layer costs.
        ConvertRateAndCost(layer, 'cost');
        SetAllLayersCost(analysis);
    });

    // Listen for change to excess for base rate + ilf method.
    $('.method-inputs-baserate input[name="excess"]').change(function () {
        console.log("Base Excess Change");
        var analysis = $(this).closest('.analysis');

        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to count for frequency + severity method.
    $('.method-inputs-frequency input[name="count"]').change(function () {
        console.log("Base Count Change");
        var analysis = $(this).closest('.analysis');

        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to excess for frequency + severity method.
    $('.method-inputs-frequency input[name="excess"]').change(function () {
        console.log("Base Excess Change");
        var analysis = $(this).closest('.analysis');
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to layers limit.
    $('.layer-area input[name="limit"]').change(function () {
        console.log("Layer Limit Change");
        var analysis = $(this).closest('.analysis');
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });

    // Listen for change to layers excess.
    $('.layer-area input[name="excess"]').change(function () {
        console.log("Layer Excess Change");
        var analysis = $(this).closest('.analysis');
        
        // Calculate layer costs.
        SetAllLayersCost(analysis);
    });
});

/**
 * Calculates average Layer cost using the Base Rate & ILF method.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} baseRate Ratio of average Base cost to Base Limit (units per million).
 * @param {Number} baseLimit Base Layer Limit (millions).
 * @param {Number} baseExcess Base Layer Excess FGU (millions).
 * @param {Number} limit Layer Limit (millions).
 * @param {Number} excess Layer Excess FGU (millions).
 * @returns {Number} Array of cost (millions) and cost / limit (units).
 */
function BaseRateILFCost(sigma, alpha, baseRate, baseLimit, baseExcess, limit, excess) {
    var ilfFactor = IlfFactor(sigma, alpha, baseLimit, baseExcess, limit, excess);
    var cost = ((baseRate / 1000000) * baseLimit) * ilfFactor;
    var rate = (cost * 1000000) / limit;
    console.log(['BaseRateILFCost', sigma, alpha, baseRate, baseLimit, baseExcess, limit, excess, [cost, rate]]);
    return [cost, rate];
}

/**
 * Calculates average FGU loss severity.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} cap FGU severity cap (millions).
 * @returns {Number} Single value (millions).
 */
 function CappedSeverity(sigma, alpha, cap) {
    var cappedSeverity = Math.pow(sigma, alpha) / (1 - alpha) * (Math.pow(cap, (1 - alpha)) - Math.pow(sigma, (1 - alpha)));
    console.log(['CappedSeverity', sigma, alpha, cap, cappedSeverity]);
    return cappedSeverity;
}

/**
 * Converts rate to cost or cost to rate depending on name when event is triggered.
 * @param {JQuery object} layer 
 * @param {String} name 
 */
function ConvertRateAndCost(layer, name) {
    var limit = parseFloat(layer.find('input[name="limit"]').val());
    if (name === 'rate') {
        var rate = parseFloat(layer.find('input[name="rate"]').val());
        layer.find('input[name="cost"]').val(Math.round((rate * limit / 1000000) * 1000) / 1000);
    } else {
        var cost = parseFloat(layer.find('input[name="cost"]').val());
        layer.find('input[name="rate"]').val(Math.round(cost / limit * 1000000));
    }
}

/**
 * Calculates probability that FGU loss severity is greater than Excess FGU.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} excess Excess FGU (millions).
 * @returns {Number} Single value (percent).
 */
 function ExceedenceProbability(sigma, alpha, excess) {
    var ep = Math.pow((sigma / excess), alpha);
    console.log(['ExceedenceProbability', sigma, alpha, excess, ep]);
    return ep;
}

/**
 * Calculates average Layer cost using the Frequency & Severity method.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} baseCount Count of losses greater than Base Layer Excess FGU (units).
 * @param {Number} baseExcess Base Layer Excess FGU (millions).
 * @param {Number} limit Layer Limit (millions).
 * @param {Number} excess Layer Excess FGU (millions).
 * @returns {Number} Array of cost (millions) and cost / limit (units).
 */
function FrequencySeverityCost(sigma, alpha, baseCount, baseExcess, limit, excess) {
    console.log('FrequencySeverityCost');
    var epBaseExcess = ExceedenceProbability(sigma, alpha, baseExcess);
    var epExcess = ExceedenceProbability(sigma, alpha, excess);
    var layerSeverity = LayerSeverity(sigma, alpha, limit, excess);
    var cost = ((epExcess / epBaseExcess) * baseCount) * layerSeverity;
    var rate = (cost * 1000000) / limit;
    console.log([sigma, alpha, baseCount, baseExcess, limit, excess, [cost, rate]]);
    return [cost, rate];
}

/**
 * Gets Pareto Type I scale and shape parameters when an event is triggered.
 * @param {JQuery obect} analysis Analysis.
 * @returns {Number} Array of scale (sigma) and shape (alpha).
 */
function GetIlfInputs(analysis) {
    var sigma = parseFloat(analysis.find('.method-inputs-ilf input[name="ilfScale"]').val());
    var alpha = parseFloat(analysis.find('.method-inputs-ilf input[name="ilfShape"]').val());
    return [sigma, alpha];
}

/**
 * Gets layer limit and excess when an event is triggered.
 * @param {JQuery obect} layer Layer. 
 * @returns {Number} Array of scale (sigma) and shape (alpha).
 */
function GetLayerInputs(layer) {
    var limit = parseFloat(layer.find('input[name="limit"]').val());
    var excess = parseFloat(layer.find('input[name="excess"]').val());
    return [limit, excess];
}

/**
 * Getseither base rate or frequency parameters depending on method selected when an event is triggered.
 * @param {String} method "0" = base rate and "1" = frequency. 
 * @param {JQuery obect} analysis Analysis. 
 * @returns {Number} Array of scale (sigma) and shape (alpha).
 */
function GetMethodInputs(method, analysis) {
    var baseRate;
    var baseLimit;
    var baseExcess;
    if (method === "0") {
        baseRate = parseFloat(analysis.find('.method-inputs-baserate input[name="rate"]').val());
        baseLimit = parseFloat(analysis.find('.method-inputs-baserate input[name="limit"]').val());
        baseExcess = parseFloat(analysis.find('.method-inputs-baserate input[name="excess"]').val());
        return [baseRate, baseLimit, baseExcess];
    } else if (method === "1") {
        baseCount = parseFloat(analysis.find('.method-inputs-frequency input[name="count"]').val());
        baseExcess = parseFloat(analysis.find('.method-inputs-frequency input[name="excess"]').val());
        return [baseCount, baseExcess];
    }
}

/**
 * Calculates Layer Severity Layer 2 / Layer Severity Layer 1 ratio.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} limit1 Layer 1 Limit (millions).
 * @param {Number} excess1 Layer 1 Excess FGU (millions).
 * @param {Number} limit2 Layer 2 Limit (millions).
 * @param {Number} excess2 Layer 2 Excess FGU (millions).
 * @returns {Number} Single value (percent).
 */
 function IlfFactor(sigma, alpha, limit1, excess1, limit2, excess2) {
    var layerSeverity1 = LayerSeverity(sigma, alpha, limit1, excess1);
    var layerSeverity2 = LayerSeverity(sigma, alpha, limit2, excess2);
    var ilfFactor = layerSeverity2 / layerSeverity1;
    console.log(['IlfFactor', sigma, alpha, limit1, excess1, limit2, excess2, ilfFactor]);
    return ilfFactor;
}

/**
 * Calculates average layer loss severity.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} limit Layer Limit (millions).
 * @param {Number} excess Layer Excess FGU (millions).
 * @returns {Number} Single value (millions).
 */
 function LayerSeverity(sigma, alpha, limit, excess) {
    var cappedSeverityLimitPlusExcess = CappedSeverity(sigma, alpha, limit + excess);
    var cappedSeverityExcess = CappedSeverity(sigma, alpha, excess);
    var layerSeverity = cappedSeverityLimitPlusExcess - cappedSeverityExcess;
    console.log(['LayerSeverity', sigma, alpha, limit, excess, layerSeverity]);
    return layerSeverity;
}

/**
 * Calculates ILF Layer 2 / ILF Layer 1 ratio.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} limit1 Layer 1 Limit (millions).
 * @param {Number} excess1 Layer 1 Excess FGU (millions).
 * @param {Number} limit2 Layer 2 Limit (millions).
 * @param {Number} excess2 Layer 2 Excess FGU (millions).
 * @returns {Number} Single value (percent).
 */
 function RateRelativity(sigma, alpha, limit1, excess1, limit2, excess2) {
    var ilfFactor = IlfFactor(sigma, alpha, limit1, excess1, limit2, excess2);
    var limitsRatio = limit2 / limit1;
    var rateRelativity = ilfFactor / limitsRatio;
    console.log(['RateRelativity', sigma, alpha, limit1, excess1, limit2, excess2, rateRelativity]);
    return rateRelativity;
}

/**
 * Calculates the layer rate and cost for all layers when an event is triggered.
 * @param {JQuery object} analysis Analysis. 
 */
function SetAllLayersCost(analysis) {
    console.log('SetAllLayersCost');
    var layers = analysis.find('.layer-area tbody tr');
    layers.each(function () {
        SetLayerCost($(this));
    });
}

/**
 * Calculates the layer rate and cost for a single layers when an event is triggered.
 * @param {JQuery object} layer Layer.
 */
function SetLayerCost(layer) {
    console.log("SetLayerCost");
    var layerInputs = GetLayerInputs(layer);
    var analysis = layer.closest('.analysis');
    var ilfInputs = GetIlfInputs(analysis);
    var method = analysis.find('input[name="method"]:checked').val();
    var methodInputs;
    var cost;
    if (method === "0") {
        methodInputs = GetMethodInputs(method, analysis);
        cost = BaseRateILFCost(ilfInputs[0], ilfInputs[1], methodInputs[0], methodInputs[1], methodInputs[2], layerInputs[0], layerInputs[1]);
        layer.find('input[name="rate"]').val(String(Math.round(cost[1])));
        layer.find('input[name="cost"]').val(String(Math.round(cost[0] * 1000) / 1000));
    } else if (method === "1") {
        methodInputs = GetMethodInputs(method, analysis);
        cost = FrequencySeverityCost(ilfInputs[0], ilfInputs[1], methodInputs[0], methodInputs[1], layerInputs[0], layerInputs[1]);
        layer.find('input[name="rate"]').val(String(Math.round(cost[1])));
        layer.find('input[name="cost"]').val(String(Math.round(cost[0] * 1000) / 1000));
    }
}