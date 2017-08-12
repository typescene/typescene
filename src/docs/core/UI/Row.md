# UI.Row

Within a row, you can place one or more `UI.ControlElement` components, i.e. controls, such as labels, buttons, and text fields. These are positioned in a single line horizontally within the row (from left to right -- that is, if the current `culture` is configured for left-to-right flow). Space around and between elements is added automatically, using the `.spacing` and `.verticalSpacing` properties.

Not all controls get the same width: you can adjust each control's width so that it takes up more or less space within the containing row. Use these properties:

* [`.width`](~/UI.ControlElement/width): set to a CSS length value such as `12rem`, `20px`, or `50%`, to specify a control's width explicitly.
* [`.shrinkwrap`](~/UI.ControlElement/shrinkwrap): set to `true` to have the control's width _minimized_ to the point where it fits its contents exactly (useful for a label or a button). Set to `false` to have the control take up as _much_ space as it can within the row.

By default, text fields are not 'shrinkwrapped' (except for `UI.WideLabel` and `UI.Paragraph`), whereas labels and buttons are. The special `UI.Spacer` component is a blank control that can be used to take up space between other elements.

You can also place non-control components in a row, but these need to be wrapped in a `UI.ContainerControl` or `UI.BlockControl`. This is done automatically by a component factory if you pass containers or blocks into [`UI.Row.with(...)`](~/UI.Row.with). Multiple controls can be stacked vertically with the `UI.ControlStack` component.

## Examples
<!-- type: example -->
<!-- collapse: heading -->
<!-- displayResult: rows -->

<pre hidden>var rows = UI.Container.with(
</pre>

```typescript
// 1. default: button shrinkwrapped, text field not
UI.Row.with(
    UI.tl`1.`, // <== 'text label' shortcut function
    UI.TextField.with({ placeholderText: "Long input" }),
    UI.Button.withLabel("Button")
),
UI.Divider,

// 2. you can un-shrink the button, too:
UI.Row.with(
    UI.tl`2.`,
    UI.Button.with({ label: "Long button", shrinkwrap: false })
),
UI.Divider,

// 3. set widths for more precise control:
UI.CenterRow.with(
    UI.tl`3.`,
    UI.CloseControlStack.with(
        { horzAlign: "right", width: "4rem" },
        UI.tl`up`, UI.tl`down`
    ),
    UI.TextField.with({ width: "4rem", shrinkwrap: true }),
    UI.TextField.with({ width: "4rem", shrinkwrap: true }),
    UI.TextField.with({ width: "4rem", shrinkwrap: true })
),
UI.Divider,

// 4. set spacing:
UI.Row.with(
    { spacing: "2rem" },
    UI.tl`4.`,
    UI.Label.withText("More space"),
    UI.Paragraph.withText("Use a paragraph if you need text " +
        "to flow across lines within a label. The paragraph " +
        "component is not shrinkwrapped by default, so it " +
        "expands to the available width within a row.")
),

// 5. set row height explicitly if needed:
UI.Row.with(
    { height: "2rem", style: { background: "#eee" } },
    UI.tl`5.`,
    UI.Heading2.withText("Left"),
    UI.Spacer,
    UI.Label.withText("Right")
)
```

<pre hidden>)</pre>
