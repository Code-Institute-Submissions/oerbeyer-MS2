/**
 * Calculates average FGU loss severity.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} cap FGU severity cap (millions).
 * @returns {Number} Single value (millions).
 */
function CappedSeverity(sigma, alpha, cap) {
    let cappedSeverity = Math.pow(sigma, alpha) / ( 1 - alpha ) * ( Math.pow(cap, ( 1 - alpha )) - Math.pow(sigma, ( 1 - alpha )) );
    console.log(['CappedSeverity', sigma, alpha, cap, cappedSeverity]);
    return cappedSeverity
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
    let cappedSeverityLimitPlusExcess = CappedSeverity(sigma, alpha, limit + excess);
    let cappedSeverityExcess = CappedSeverity(sigma, alpha, excess);
    let layerSeverity = cappedSeverityLimitPlusExcess - cappedSeverityExcess;
    console.log(['LayerSeverity', sigma, alpha, layerSeverity]);
    return layerSeverity;
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
    let layerSeverity1 = LayerSeverity(sigma, alpha, limit1, excess1);
    let layerSeverity2 = LayerSeverity(sigma, alpha, limit2, excess2);
    let ilfFactor = layerSeverity2 / layerSeverity1;
    console.log(['IlfFactor', sigma, alpha, ilfFactor]);
    return ilfFactor;
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
    let ilfFactor = IlfFactor(sigma, alpha, limit1, excess1, limit2, excess2);
    let limitsRatio = limit2 / limit1;
    let rateRelativity = ilfFactor / limitsRatio;
    console.log(['RateRelativity', sigma, alpha, rateRelativity]);
    return rateRelativity;
}

/**
 * Calculates probability that FGU loss severity is greater than Excess FGU.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} excess Excess FGU (millions).
 * @returns {Number} Single value (percent).
 */
function ExceedenceProbability(sigma, alpha, excess) {
    let ep = ( sigma / excess ) ** alpha; 
    console.log(['ExceedenceProbability', sigma, alpha, ep]);
    return ep;
}

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
    let ilfFactor = IlfFactor(sigma, alpha, baseLimit, baseExcess, limit, excess);
    let cost = ( ( baseRate / 1000000 ) * baseLimit ) * ilfFactor;
    let rate = (cost * 1000000) / limit;
    console.log(['BaseRateILFCost', sigma, alpha, cost, rate]);
    return [cost, rate];
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
    epBaseExcess = ExceedenceProbability(sigma, alpha, baseExcess)
    epExcess = ExceedenceProbability(sigma, alpha, excess)
    let layerSeverity = LayerSeverity(sigma, alpha, limit, excess);
    let cost = ( ( epExcess / epBaseExcess ) * baseCount ) * layerSeverity;
    let rate = (cost * 1000000) / limit;
    console.log([sigma, alpha, cost, rate]);
    return [cost, rate];
}

$('document').ready(function(){

    // Listen for click on add layer buttons.
    $('.layer-buttons-add').click(function() {
        let oldLayer = $(this).closest('.layer-area').find('tbody tr').last();
        oldLayer.clone(true).appendTo(oldLayer.parent());
        let newLayer = oldLayer.next();
        newLayer.find('.layer-excess input').val(
            parseFloat(oldLayer.find('.layer-limit input').val()) + parseFloat(oldLayer.find('.layer-excess input').val())
        );
        SetLayerCost(newLayer);
    });

    // Listen for click on remove layer buttons.
    $('.layer-buttons-remove').click(function() {
        let layer = $(this).closest('.layer-area').find('tbody tr').last();
        if (layer.siblings().length > 0) {
            layer.remove();
        }
    });

    // Listen for change to ilf scale parameter.
    $('.method-inputs-ilf input[name="ilfScale"]').change(function() {
        console.log("ILF Scale Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        SetAllLayersCost(analysis);
    });

    // Listen for change to ilf shape parameter.
    $('.method-inputs-ilf input[name="ilfShape"]').change(function() {
        console.log("ILF Shape Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        SetAllLayersCost(analysis);
    });

    // Listen for change to rate for base rate + ilf method.
    $('.method-inputs-baserateilf input[name="rate"]').change(function() {
        console.log("Base Rate Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        layer = analysis.find('.method-area tbody tr')
        ConvertRateToCost(layer)
        SetAllLayersCost(analysis);

    });

    // Listen for change to limit for base rate + ilf method.
    $('.method-inputs-baserateilf input[name="limit"]').change(function() {
        console.log("Base Limit Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        layer = analysis.find('.method-area tbody tr')
        ConvertRateToCost(layer)
        SetAllLayersCost(analysis);

    });

    // Listen for change to excess for base rate + ilf method.
    $('.method-inputs-baserateilf input[name="excess"]').change(function() {
        console.log("Base Excess Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        SetAllLayersCost(analysis);
    });

    // Listen for change to layers limit.
    $('.layer-area input[name="limit"]').change(function() {
        console.log("Layer Limit Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        SetAllLayersCost(analysis);
    });

    // Listen for change to layers excess.
    $('.layer-area input[name="excess"]').change(function() {
        console.log("Layer Excess Change")
        // Recalculate all layers in the analaysis
        analysis = $(this).closest('.analysis');
        SetAllLayersCost(analysis);
    });

});

function ConvertRateToCost(layer) {
    let limit = parseFloat(layer.find('input[name="limit"]').val());
    let rate = parseFloat(layer.find('input[name="rate"]').val());
    layer.find('input[name="cost"]').val( rate / 1000000 * limit );
}

function GetMethodInputs(method, analysis) {
    if (method === "0") {
        let baseRate = parseFloat(analysis.find('.method-inputs-baserateilf input[name="rate"]').val());
        let baseLimit = parseFloat(analysis.find('.method-inputs-baserateilf input[name="limit"]').val());
        let baseExcess = parseFloat(analysis.find('.method-inputs-baserateilf input[name="excess"]').val());
        return [baseRate, baseLimit, baseExcess];
    } else if (method === "1") {
        let baseCount = parseFloat(analysis.find('.method-inputs-frequencyseverity input[name="count"]').val());
        let baseExcess = parseFloat(analysis.find('.method-inputs-frequencyseverity input[name="excess"]').val());
        return [baseCount, baseExcess];
    }
}

function GetIlfInputs(analysis) {
    let sigma = parseFloat(analysis.find('.method-inputs-ilf input[name="ilfScale"]').val());
    let alpha = parseFloat(analysis.find('.method-inputs-ilf input[name="ilfShape"]').val());
    return [sigma, alpha];
}

function GetLayerInputs(layer) {
    let limit = parseFloat(layer.find('input[name="limit"]').val());
    let excess = parseFloat(layer.find('input[name="excess"]').val());
    return [limit, excess];
}

function SetLayerCost(layer) {
    console.log("SetLayerCost");
    let layerInputs = GetLayerInputs(layer);
    let analysis = layer.closest('.analysis');
    let ilfInputs = GetIlfInputs(analysis);
    let method = analysis.find('input[name="method"]:checked').val();
    if (method === "0") {
        let methodInputs = GetMethodInputs(method, analysis);                
        let cost = BaseRateILFCost(ilfInputs[0], ilfInputs[1], methodInputs[0], methodInputs[1], methodInputs[2], layerInputs[0], layerInputs[1])
        layer.find('input[name="rate"]').val(String(Math.round(cost[1])));
        layer.find('input[name="cost"]').val(String(Math.round( cost[0] *  1000 ) / 1000));
    } else if (method === "1") {

    }
}

function SetAllLayersCost(analysis) {
    console.log('SetAllLayersCost');
    let layers = analysis.find('.layer-area tbody tr');
    layers.each(function(){
        SetLayerCost($(this));
    });
}