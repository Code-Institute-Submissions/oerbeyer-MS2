/**
 * Calculates average FGU loss severity.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} cap FGU severity cap (millions).
 * @returns {Number} Single value (millions).
 */
function CappedSeverity(sigma, alpha, cap) {
    return 1 / ( 1 - alpha ) * ( cap ** ( 1 - alpha ) - sigma ** ( 1 - alpha ) );
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
    return cappedSeverityLimitPlusExcess - cappedSeverityExcess;
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
    return layerSeverity2 / layerSeverity1;
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
    return ilfFactor / limitsRatio;
}

/**
 * Calculates probability that FGU loss severity is greater than Excess FGU.
 * @param {Number} sigma Pareto Type I scale parameter.
 * @param {Number} alpha Pareto Type I shape parameter.
 * @param {Number} excess Excess FGU (millions).
 * @returns {Number} Single value (percent).
 */
function ExceedenceProbability(sigma, alpha, excess) {
    return ( sigma / excess ) ** alpha;
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
    epBaseExcess = ExceedenceProbability(sigma, alpha, baseExcess)
    epExcess = ExceedenceProbability(sigma, alpha, excess)
    let layerSeverity = LayerSeverity(sigma, alpha, limit, excess);
    let cost = ( ( epExcess / epBaseExcess ) * baseCount ) * layerSeverity;
    let rate = (cost * 1000000) / limit;
    return [cost, rate];
}

$('document').ready(function(){
    
    // Listen for click on add layer button.
    $('.layer-add').click(function() {

        let layer = $(this).siblings('table').children('tbody').children().last();
        layer.clone().appendTo(layer.parent());

    });

    // Listen for changes to limit or excess inputs.
    $('.layer-input').change(function() {
        
        let layer = $(this).closest('.layer');

        // Update the layer description when limit or excess inputs change.
        layer.children('.layer-description').text(SetLayerDescriptionOnChange($(this)));

        // Update the layer cost when limit or excess inputs change but only when rate change is also an input.
        if (layer.find('.rate-input').length > 0) {
            layer.children('.layer-cost').text(SetLayerCostOnChange($(this)));
        }

    });

    // Listen for changes to the rate input.
    $('.rate-input').change(function() {
        
        // Update the layer cost when rate input changes.
        $(this).closest('.layer').children('.layer-cost').text(SetLayerCostOnChange($(this)));
    });

});

/**
 * Parses a string from Limit and Excess FGU layer inputs.
 * @param {Element} layer The <input class="layer-input"> element.
 * @returns {String} Limit xs Excess FGU
 */
function SetLayerDescriptionOnChange(layerInput) {
    let layer = layerInput.closest('.layer').children();
    let limit = layer.filter('.layer-limit').children('.layer-input').val();
    let excess = layer.filter('.layer-excess').children('.layer-input').val();
    return `${limit}m xs ${excess}m`;
}

function SetLayerCostOnChange(layerInput) {
    let layer = layerInput.closest('.layer').children();
    let limit = layer.filter('.layer-limit').children('.layer-input').val();
    let rate = layer.filter('.layer-rate').children('.rate-input').val();
    return ( rate / 1000000 ) * limit
}