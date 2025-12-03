/**
 * CSS Default Values Map
 * Used to determine if a style property is "active" (user-defined) vs default browser value
 */

// Common CSS default values for block elements
export const CSS_DEFAULTS: Record<string, string[]> = {
  // Display & Layout
  display: ["block", "inline"],
  position: ["static"],
  float: ["none"],
  clear: ["none"],
  visibility: ["visible"],
  overflow: ["visible"],
  overflowX: ["visible"],
  overflowY: ["visible"],

  // Flexbox
  flexDirection: ["row"],
  flexWrap: ["nowrap"],
  justifyContent: ["normal", "flex-start"],
  alignItems: ["normal", "stretch"],
  alignContent: ["normal"],
  gap: ["normal", "0px", "0"],
  rowGap: ["normal", "0px", "0"],
  columnGap: ["normal", "0px", "0"],
  flexGrow: ["0"],
  flexShrink: ["1"],
  flexBasis: ["auto"],
  order: ["0"],
  alignSelf: ["auto"],

  // Grid
  gridTemplateColumns: ["none"],
  gridTemplateRows: ["none"],
  gridColumn: ["auto"],
  gridRow: ["auto"],

  // Box Model - Spacing
  margin: ["0px", "0"],
  marginTop: ["0px", "0"],
  marginRight: ["0px", "0"],
  marginBottom: ["0px", "0"],
  marginLeft: ["0px", "0"],
  padding: ["0px", "0"],
  paddingTop: ["0px", "0"],
  paddingRight: ["0px", "0"],
  paddingBottom: ["0px", "0"],
  paddingLeft: ["0px", "0"],

  // Size
  width: ["auto"],
  height: ["auto"],
  minWidth: ["auto", "0px", "0"],
  maxWidth: ["none"],
  minHeight: ["auto", "0px", "0"],
  maxHeight: ["none"],

  // Typography
  fontFamily: [""],  // Browser default varies
  fontSize: ["16px", "medium"],
  fontWeight: ["400", "normal"],
  fontStyle: ["normal"],
  lineHeight: ["normal"],
  letterSpacing: ["normal", "0px"],
  textAlign: ["start", "left"],
  textDecoration: ["none"],
  textDecorationLine: ["none"],
  textTransform: ["none"],
  whiteSpace: ["normal"],
  wordBreak: ["normal"],
  wordSpacing: ["normal", "0px"],
  textIndent: ["0px", "0"],

  // Colors & Backgrounds
  color: ["rgb(0, 0, 0)", "#000000", "black"],  // Usually inherited, but default is black
  backgroundColor: ["transparent", "rgba(0, 0, 0, 0)"],
  backgroundImage: ["none"],
  backgroundPosition: ["0% 0%", "0px 0px"],
  backgroundSize: ["auto", "auto auto"],
  backgroundRepeat: ["repeat"],
  backgroundAttachment: ["scroll"],

  // Borders
  borderStyle: ["none"],
  borderWidth: ["0px", "0"],
  borderTopWidth: ["0px", "0"],
  borderRightWidth: ["0px", "0"],
  borderBottomWidth: ["0px", "0"],
  borderLeftWidth: ["0px", "0"],
  borderColor: ["currentcolor"],
  borderRadius: ["0px", "0"],
  borderTopLeftRadius: ["0px", "0"],
  borderTopRightRadius: ["0px", "0"],
  borderBottomRightRadius: ["0px", "0"],
  borderBottomLeftRadius: ["0px", "0"],

  // Box Shadow & Effects
  boxShadow: ["none"],
  textShadow: ["none"],
  opacity: ["1"],
  filter: ["none"],
  backdropFilter: ["none"],
  mixBlendMode: ["normal"],

  // Transforms
  transform: ["none"],
  transformOrigin: ["50% 50%", "50% 50% 0px", "center center"],

  // Transitions & Animations
  transition: ["none", "all 0s ease 0s"],
  transitionDuration: ["0s"],
  transitionDelay: ["0s"],
  transitionProperty: ["all"],
  transitionTimingFunction: ["ease"],
  animation: ["none"],
  animationDuration: ["0s"],
  animationDelay: ["0s"],

  // Cursor & Pointer
  cursor: ["auto"],
  pointerEvents: ["auto"],
  userSelect: ["auto"],

  // Z-index & Stacking
  zIndex: ["auto"],
  isolation: ["auto"],

  // Outline
  outline: ["none"],
  outlineWidth: ["0px", "0"],
  outlineStyle: ["none"],
  outlineOffset: ["0px", "0"],

  // List
  listStyle: ["disc outside none"],
  listStyleType: ["disc", "none"],
  listStylePosition: ["outside"],

  // Table
  borderCollapse: ["separate"],
  borderSpacing: ["0px", "0px 0px"],
  tableLayout: ["auto"],

  // Other
  objectFit: ["fill"],
  objectPosition: ["50% 50%", "center center"],
  aspectRatio: ["auto"],
};

/**
 * Check if a computed style value is a default (non-active) value
 * @param property - CSS property name (camelCase)
 * @param value - The computed style value
 * @returns true if the value is a default, false if it's user-defined
 */
export function isDefaultValue(property: string, value: string): boolean {
  const defaults = CSS_DEFAULTS[property];
  if (!defaults) {
    // If we don't have defaults for this property, treat as default
    // to avoid false positives
    return true;
  }

  // Normalize the value for comparison
  const normalizedValue = value.toLowerCase().trim();

  return defaults.some(defaultVal => {
    const normalizedDefault = defaultVal.toLowerCase().trim();
    return normalizedValue === normalizedDefault;
  });
}

/**
 * Check if a property has an active (user-defined) value
 * @param property - CSS property name (camelCase)
 * @param computedValue - The computed style value
 * @param inlineStyles - Object containing inline styles from style attribute
 * @returns true if the property is actively set by the user
 */
export function isPropertyActive(
  property: string,
  computedValue: string,
  inlineStyles: Record<string, string>
): boolean {
  // If the property exists in inline styles, it's definitely active
  if (property in inlineStyles) {
    return true;
  }

  // Check if the computed value differs from defaults
  // This catches CSS class-based styling
  if (!isDefaultValue(property, computedValue)) {
    return true;
  }

  return false;
}

/**
 * Get active status for multiple properties at once
 * @param properties - Array of property names to check
 * @param computedStyles - Object containing computed styles
 * @param inlineStyles - Object containing inline styles
 * @returns Object with property names as keys and boolean active status as values
 */
export function getActiveProperties(
  properties: string[],
  computedStyles: Record<string, string>,
  inlineStyles: Record<string, string>
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const prop of properties) {
    const computedValue = computedStyles[prop] || "";
    result[prop] = isPropertyActive(prop, computedValue, inlineStyles);
  }

  return result;
}

/**
 * Check if any property in a group is active
 * @param properties - Array of property names to check
 * @param activeProperties - Object with property active status
 * @returns true if at least one property is active
 */
export function hasSectionActiveProperties(
  properties: string[],
  activeProperties: Record<string, boolean>
): boolean {
  return properties.some(prop => activeProperties[prop] === true);
}

// Property groups for each section
export const SECTION_PROPERTIES = {
  spacing: [
    "marginTop", "marginRight", "marginBottom", "marginLeft",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"
  ],
  size: [
    "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"
  ],
  typography: [
    "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "color"
  ],
  background: [
    "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition"
  ],
  border: [
    "borderWidth", "borderStyle", "borderColor", "borderRadius",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"
  ],
  position: [
    "position", "top", "right", "bottom", "left", "zIndex"
  ],
  effects: [
    "opacity", "boxShadow", "filter", "backdropFilter", "mixBlendMode", "cursor", "overflow", "visibility"
  ],
  transforms: [
    "transform", "transformOrigin", "perspective"
  ]
};
