import { ComponentConstructor } from "../core";
import {
  UIBorderlessButton,
  UIBorderlessTextField,
  UIButton,
  UICell,
  UICenterRow,
  UICloseColumn,
  UICloseLabel,
  UICloseRow,
  UIColumn,
  UIConditional,
  UICoverCell,
  UIExpandedLabel,
  UIFlowCell,
  UIForm,
  UIFormContextController,
  UIHeading1,
  UIHeading2,
  UIHeading3,
  UIIconButton,
  UIImage,
  UILabel,
  UILargeButton,
  UILinkButton,
  UIListCellAdapter,
  UIListController,
  UIMenu,
  UIModalController,
  UIOppositeRow,
  UIOutlineButton,
  UIParagraph,
  UIPrimaryButton,
  UIRow,
  UIScrollContainer,
  UISelectionController,
  UISeparator,
  UISmallButton,
  UISpacer,
  UIStyleController,
  UITextField,
  UIToggle,
  UIViewRenderer,
} from "../ui/";

// add all intrinsics to an object so that JSX(...) can find the correct classes
export const tags = {
  cell: UICell,
  covercell: UICoverCell,
  flowcell: UIFlowCell,
  form: UIForm,
  row: UIRow,
  closerow: UICloseRow,
  centerrow: UICenterRow,
  oppositerow: UIOppositeRow,
  column: UIColumn,
  closecolumn: UICloseColumn,
  scrollcontainer: UIScrollContainer,
  button: UIButton,
  iconbutton: UIIconButton,
  largebutton: UILargeButton,
  smallbutton: UISmallButton,
  linkbutton: UILinkButton,
  outlinebutton: UIOutlineButton,
  borderlessbutton: UIBorderlessButton,
  primarybutton: UIPrimaryButton,
  label: UILabel,
  closelabel: UICloseLabel,
  expandedlabel: UIExpandedLabel,
  p: UIParagraph,
  h1: UIHeading1,
  h2: UIHeading2,
  h3: UIHeading3,
  textfield: UITextField,
  borderlesstextfield: UIBorderlessTextField,
  img: UIImage,
  toggle: UIToggle,
  separator: UISeparator,
  spacer: UISpacer,
  conditional: UIConditional,
  formcontext: UIFormContextController,
  list: UIListController,
  listcell: UIListCellAdapter,
  menu: UIMenu,
  modal: UIModalController,
  selection: UISelectionController,
  style: UIStyleController,
  view: UIViewRenderer,
  viewcontent: UIViewRenderer.withBoundContent(),
};

export interface Elements {
  cell: ComponentConstructor.PresetArgType<typeof UICell>;
  covercell: ComponentConstructor.PresetArgType<typeof UICoverCell>;
  flowcell: ComponentConstructor.PresetArgType<typeof UIFlowCell>;
  form: ComponentConstructor.PresetArgType<typeof UIForm>;
  row: ComponentConstructor.PresetArgType<typeof UIRow>;
  closerow: ComponentConstructor.PresetArgType<typeof UICloseRow>;
  centerrow: ComponentConstructor.PresetArgType<typeof UICenterRow>;
  oppositerow: ComponentConstructor.PresetArgType<typeof UIOppositeRow>;
  column: ComponentConstructor.PresetArgType<typeof UIColumn>;
  closecolumn: ComponentConstructor.PresetArgType<typeof UICloseColumn>;
  scrollcontainer: ComponentConstructor.PresetArgType<typeof UIScrollContainer>;
  button: ComponentConstructor.PresetArgType<typeof UIButton>;
  iconbutton: ComponentConstructor.PresetArgType<typeof UIIconButton>;
  largebutton: ComponentConstructor.PresetArgType<typeof UILargeButton>;
  smallbutton: ComponentConstructor.PresetArgType<typeof UISmallButton>;
  linkbutton: ComponentConstructor.PresetArgType<typeof UILinkButton>;
  outlinebutton: ComponentConstructor.PresetArgType<typeof UIOutlineButton>;
  borderlessbutton: ComponentConstructor.PresetArgType<typeof UIBorderlessButton>;
  primarybutton: ComponentConstructor.PresetArgType<typeof UIPrimaryButton>;
  label: ComponentConstructor.PresetArgType<typeof UILabel>;
  closelabel: ComponentConstructor.PresetArgType<typeof UICloseLabel>;
  expandedlabel: ComponentConstructor.PresetArgType<typeof UIExpandedLabel>;
  p: ComponentConstructor.PresetArgType<typeof UIParagraph>;
  h1: ComponentConstructor.PresetArgType<typeof UIHeading1>;
  h2: ComponentConstructor.PresetArgType<typeof UIHeading2>;
  h3: ComponentConstructor.PresetArgType<typeof UIHeading3>;
  textfield: ComponentConstructor.PresetArgType<typeof UITextField>;
  borderlesstextfield: ComponentConstructor.PresetArgType<typeof UIBorderlessTextField>;
  img: ComponentConstructor.PresetArgType<typeof UIImage>;
  toggle: ComponentConstructor.PresetArgType<typeof UIToggle>;
  separator: ComponentConstructor.PresetArgType<typeof UISeparator>;
  spacer: ComponentConstructor.PresetArgType<typeof UISpacer>;
  conditional: ComponentConstructor.PresetArgType<typeof UIConditional>;
  formcontext: ComponentConstructor.PresetArgType<typeof UIFormContextController>;
  list: ComponentConstructor.PresetArgType<typeof UIListController>;
  listcell: ComponentConstructor.PresetArgType<typeof UIListCellAdapter>;
  menu: ComponentConstructor.PresetArgType<typeof UIMenu>;
  modal: ComponentConstructor.PresetArgType<typeof UIModalController>;
  selection: ComponentConstructor.PresetArgType<typeof UISelectionController>;
  style: ComponentConstructor.PresetArgType<typeof UIStyleController>;
  /** Renderable component that encapsulates a referenced view, see `UIViewRenderer` */
  view: ComponentConstructor.PresetArgType<typeof UIViewRenderer>;
  /** UIViewRenderer that displays a view bound to the `content` property; for use within view components */
  viewcontent: ComponentConstructor.PresetArgType<typeof UIViewRenderer>;
}
