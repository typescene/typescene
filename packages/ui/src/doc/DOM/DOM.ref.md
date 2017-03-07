# DOM.setCSSRemSize
It should not be necessary to call this function explicitly, since `rem` size is overridden at 16px by default.

However, if this value is in turn overridden by e.g. Bootstrap loaded through `.loadExternalCSS(...)`, then the root-em size might be different. Bootstrap 3 uses 10px by default.

With Bootstrap 4 and other CSS frameworks, use this function to scale the overall size of _all_ elements.

Alternatively, to change the overall _text_ size only (which defaults to 1rem), override the `fontSize` property on the `Row` component using globally applied CSS, or by injecting a function into its initializer method chain that overrides the `fontSize` property on row component `Style` instances.
