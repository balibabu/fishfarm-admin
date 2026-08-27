import {
  Fish,
  Image,
  Video,
  Settings,
  LogOut,
  Save,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
  createIcons,
} from 'lucide'

const icons = {
  Fish,
  Image,
  Video,
  Settings,
  LogOut,
  Save,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Link: LinkIcon,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
}

export function renderIcons() {
  createIcons({ icons })
}
