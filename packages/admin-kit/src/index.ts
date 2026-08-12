// @ladigital/admin-kit — token-driven admin primitives (toast, confirm dialog,
// form fields). Re-themes per app by swapping the Tailwind `@theme` tokens.
export { toast, ToastProvider } from "./toast";
export { useConfirm, ConfirmProvider } from "./confirm-dialog";
export type { ConfirmOptions } from "./confirm-dialog";
export {
  inputBase,
  labelBase,
  primaryButton,
  TextField,
  NumberField,
  TextArea,
  Toggle,
  AdminPageHeader,
  SaveButton,
  Card,
} from "./admin-fields";
