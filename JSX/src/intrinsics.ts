import { ComponentPresetArgType, UIRow } from "../../";
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
  UIScrollContainer,
  UISelectionController,
  UISeparator,
  UISmallButton,
  UISpacer,
  UIStyleController,
  UITextField,
  UIToggle,
  UIViewRenderer,
} from "../../dist";

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
};

export interface Elements {
  cell: ComponentPresetArgType<typeof UICell>;
  covercell: ComponentPresetArgType<typeof UICoverCell>;
  flowcell: ComponentPresetArgType<typeof UIFlowCell>;
  form: ComponentPresetArgType<typeof UIForm>;
  row: ComponentPresetArgType<typeof UIRow>;
  closerow: ComponentPresetArgType<typeof UICloseRow>;
  centerrow: ComponentPresetArgType<typeof UICenterRow>;
  oppositerow: ComponentPresetArgType<typeof UIOppositeRow>;
  column: ComponentPresetArgType<typeof UIColumn>;
  closecolumn: ComponentPresetArgType<typeof UICloseColumn>;
  scrollcontainer: ComponentPresetArgType<typeof UIScrollContainer>;
  button: ComponentPresetArgType<typeof UIButton>;
  iconbutton: ComponentPresetArgType<typeof UIIconButton>;
  largebutton: ComponentPresetArgType<typeof UILargeButton>;
  smallbutton: ComponentPresetArgType<typeof UISmallButton>;
  linkbutton: ComponentPresetArgType<typeof UILinkButton>;
  outlinebutton: ComponentPresetArgType<typeof UIOutlineButton>;
  borderlessbutton: ComponentPresetArgType<typeof UIBorderlessButton>;
  primarybutton: ComponentPresetArgType<typeof UIPrimaryButton>;
  label: ComponentPresetArgType<typeof UILabel>;
  closelabel: ComponentPresetArgType<typeof UICloseLabel>;
  expandedlabel: ComponentPresetArgType<typeof UIExpandedLabel>;
  p: ComponentPresetArgType<typeof UIParagraph>;
  h1: ComponentPresetArgType<typeof UIHeading1>;
  h2: ComponentPresetArgType<typeof UIHeading2>;
  h3: ComponentPresetArgType<typeof UIHeading3>;
  textfield: ComponentPresetArgType<typeof UITextField>;
  borderlesstextfield: ComponentPresetArgType<typeof UIBorderlessTextField>;
  img: ComponentPresetArgType<typeof UIImage>;
  toggle: ComponentPresetArgType<typeof UIToggle>;
  separator: ComponentPresetArgType<typeof UISeparator>;
  spacer: ComponentPresetArgType<typeof UISpacer>;
  conditional: ComponentPresetArgType<typeof UIConditional>;
  formcontext: ComponentPresetArgType<typeof UIFormContextController>;
  list: ComponentPresetArgType<typeof UIListController>;
  listcell: ComponentPresetArgType<typeof UIListCellAdapter>;
  menu: ComponentPresetArgType<typeof UIMenu>;
  modal: ComponentPresetArgType<typeof UIModalController>;
  selection: ComponentPresetArgType<typeof UISelectionController>;
  style: ComponentPresetArgType<typeof UIStyleController>;
  view: ComponentPresetArgType<typeof UIViewRenderer>;
}
