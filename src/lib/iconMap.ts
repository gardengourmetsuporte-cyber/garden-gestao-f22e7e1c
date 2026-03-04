// Custom SVG paths (inline for zero-flicker rendering)
export const CUSTOM_SVG_PATHS: Record<string, string[]> = {
  Menu: [
    'M4,0h2c2.209,0,4,1.791,4,4v2c0,2.209-1.791,4-4,4h-2C1.791,10,0,8.209,0,6v-2C0,1.791,1.791,0,4,0Z',
    'M18,0h2c2.209,0,4,1.791,4,4v2c0,2.209-1.791,4-4,4h-2c-2.209,0-4-1.791-4-4v-2c0-2.209,1.791-4,4-4Z',
    'M4,14h2c2.209,0,4,1.791,4,4v2c0,2.209-1.791,4-4,4h-2C1.791,24,0,22.209,0,20v-2c0-2.209,1.791-4,4-4Z',
    'M18,14h2c2.209,0,4,1.791,4,4v2c0,2.209-1.791,4-4,4h-2c-2.209,0-4-1.791-4-4v-2c0-2.209,1.791-4,4-4Z',
  ],
  ClipboardCheck: [
    'm17,0H7C4.243,0,2,2.243,2,5v14c0,2.757,2.243,5,5,5h10c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5ZM7.5,4.5c.828,0,1.5.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5.672-1.5,1.5-1.5Zm0,15c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Zm1.365-5.979c-.319.319-.741.479-1.165.479-.427,0-.855-.162-1.182-.487l-.681-.655c-.398-.382-.411-1.016-.028-1.414.383-.399,1.017-.41,1.414-.028l.472.454,1.866-1.815c.396-.385,1.029-.377,1.414.02.385.396.376,1.029-.02,1.414l-2.091,2.034Zm8.135,5.479h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-3c-.552,0-1-.448-1-1s.448-1,1-1h3c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Z',
  ],
  ClipboardList: [
    'm17,0H7C4.243,0,2,2.243,2,5v14c0,2.757,2.243,5,5,5h10c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5ZM7.5,4.5c.828,0,1.5.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5.672-1.5,1.5-1.5Zm0,15c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Zm1.365-5.979c-.319.319-.741.479-1.165.479-.427,0-.855-.162-1.182-.487l-.681-.655c-.398-.382-.411-1.016-.028-1.414.383-.399,1.017-.41,1.414-.028l.472.454,1.866-1.815c.396-.385,1.029-.377,1.414.02.385.396.376,1.029-.02,1.414l-2.091,2.034Zm8.135,5.479h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-3c-.552,0-1-.448-1-1s.448-1,1-1h3c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Z',
  ],
  ListChecks: [
    'm17,0H7C4.243,0,2,2.243,2,5v14c0,2.757,2.243,5,5,5h10c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5ZM7.5,4.5c.828,0,1.5.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5.672-1.5,1.5-1.5Zm0,15c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Zm1.365-5.979c-.319.319-.741.479-1.165.479-.427,0-.855-.162-1.182-.487l-.681-.655c-.398-.382-.411-1.016-.028-1.414.383-.399,1.017-.41,1.414-.028l.472.454,1.866-1.815c.396-.385,1.029-.377,1.414.02.385.396.376,1.029-.02,1.414l-2.091,2.034Zm8.135,5.479h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-3c-.552,0-1-.448-1-1s.448-1,1-1h3c.552,0,1,.448,1,1s-.448,1-1,1Zm0-6h-5c-.552,0-1-.448-1-1s.448-1,1-1h5c.552,0,1,.448,1,1s-.448,1-1,1Z',
  ],
  Package: [
    'm17.449 3.265c-.102-.324-.362-.575-.69-.664-.09-.024-2.233-.601-4.759-.601s-4.668.577-4.758.601c-.329.089-.59.341-.692.667-.026.083-.629 2.047-.629 4.649 0 .146.002.291.006.433.348-.019.707-.031 1.074-.031 1.986 0 4.053.339 5.044.527 1.059-.204 3.038-.527 4.956-.527.367 0 .726.011 1.074.031.004-.142.006-.286.006-.432 0-2.625-.604-4.571-.63-4.652zm-4.449 3.235h-2c-.552 0-1-.448-1-1s.448-1 1-1h2c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm7 10.319c-2.482 0-4.598.567-4.687.592-.33.089-.591.341-.692.667-.025.081-.621 2.018-.621 4.582 0 2.586.596 4.504.622 4.584.103.325.362.575.69.664.089.024 2.2.592 4.688.592 1.457 0 2.981-.189 4-.346v-10.962c-1.021-.17-2.542-.372-4-.372zm.5 5.181h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm22.378 11.575c-.103-.325-.362-.575-.69-.664-.089-.024-2.2-.592-4.688-.592-1.456 0-2.977.209-4 .386v10.962c1.017.151 2.54.333 4 .333 2.482 0 4.598-.567 4.687-.592.33-.089.591-.341.692-.667.025-.081.621-2.018.621-4.582 0-2.586-.596-4.504-.622-4.584zm-3.378 3.925h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
  ],
  PackageX: [
    'm17.449 3.265c-.102-.324-.362-.575-.69-.664-.09-.024-2.233-.601-4.759-.601s-4.668.577-4.758.601c-.329.089-.59.341-.692.667-.026.083-.629 2.047-.629 4.649 0 .146.002.291.006.433.348-.019.707-.031 1.074-.031 1.986 0 4.053.339 5.044.527 1.059-.204 3.038-.527 4.956-.527.367 0 .726.011 1.074.031.004-.142.006-.286.006-.432 0-2.625-.604-4.571-.63-4.652zm-4.449 3.235h-2c-.552 0-1-.448-1-1s.448-1 1-1h2c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm7 10.319c-2.482 0-4.598.567-4.687.592-.33.089-.591.341-.692.667-.025.081-.621 2.018-.621 4.582 0 2.586.596 4.504.622 4.584.103.325.362.575.69.664.089.024 2.2.592 4.688.592 1.457 0 2.981-.189 4-.346v-10.962c-1.021-.17-2.542-.372-4-.372zm.5 5.181h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm22.378 11.575c-.103-.325-.362-.575-.69-.664-.089-.024-2.2-.592-4.688-.592-1.456 0-2.977.209-4 .386v10.962c1.017.151 2.54.333 4 .333 2.482 0 4.598-.567 4.687-.592.33-.089.591-.341.692-.667.025-.081.621-2.018.621-4.582 0-2.586-.596-4.504-.622-4.584zm-3.378 3.925h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
  ],
  PackageCheck: [
    'm17.449 3.265c-.102-.324-.362-.575-.69-.664-.09-.024-2.233-.601-4.759-.601s-4.668.577-4.758.601c-.329.089-.59.341-.692.667-.026.083-.629 2.047-.629 4.649 0 .146.002.291.006.433.348-.019.707-.031 1.074-.031 1.986 0 4.053.339 5.044.527 1.059-.204 3.038-.527 4.956-.527.367 0 .726.011 1.074.031.004-.142.006-.286.006-.432 0-2.625-.604-4.571-.63-4.652zm-4.449 3.235h-2c-.552 0-1-.448-1-1s.448-1 1-1h2c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm7 10.319c-2.482 0-4.598.567-4.687.592-.33.089-.591.341-.692.667-.025.081-.621 2.018-.621 4.582 0 2.586.596 4.504.622 4.584.103.325.362.575.69.664.089.024 2.2.592 4.688.592 1.457 0 2.981-.189 4-.346v-10.962c-1.021-.17-2.542-.372-4-.372zm.5 5.181h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
    'm22.378 11.575c-.103-.325-.362-.575-.69-.664-.089-.024-2.2-.592-4.688-.592-1.456 0-2.977.209-4 .386v10.962c1.017.151 2.54.333 4 .333 2.482 0 4.598-.567 4.687-.592.33-.089.591-.341.692-.667.025-.081.621-2.018.621-4.582 0-2.586-.596-4.504-.622-4.584zm-3.378 3.925h-2.5c-.552 0-1-.448-1-1s.448-1 1-1h2.5c.552 0 1 .448 1 1s-.448 1-1 1z',
  ],
  DollarSign: [
    'm23.949,18.293l-1.284-9c-.35-2.447-2.478-4.293-4.95-4.293h-2.566c.219-.456.351-.961.351-1.5,0-1.93-1.57-3.5-3.5-3.5s-3.5,1.57-3.5,3.5c0,.539.133,1.044.351,1.5h-2.491c-2.493,0-4.572,1.789-4.944,4.254L.057,18.254c-.218,1.441.202,2.901,1.153,4.007.951,1.105,2.333,1.739,3.791,1.739h13.998c1.45,0,2.827-.628,3.777-1.724.95-1.095,1.377-2.547,1.173-3.983ZM12,2c.827,0,1.5.673,1.5,1.5s-.673,1.5-1.5,1.5-1.5-.673-1.5-1.5.673-1.5,1.5-1.5Zm1,18v1c0,.553-.448,1-1,1s-1-.447-1-1v-1h-.268c-1.067,0-2.063-.574-2.598-1.499-.276-.479-.113-1.09.365-1.366.477-.278,1.089-.114,1.366.364.179.31.511.501.867.501h2.268c.552,0,1-.448,1-1,0-.379-.271-.698-.645-.761l-3.04-.506c-1.342-.224-2.315-1.374-2.315-2.733,0-1.654,1.346-3,3-3v-1c0-.553.448-1,1-1s1,.447,1,1v1h.268c1.067,0,2.063.574,2.598,1.499.277.479.113,1.09-.364,1.366-.48.278-1.092.112-1.366-.364-.179-.31-.511-.501-.867-.501h-2.268c-.551,0-1,.448-1,1,0,.379.271.698.644.761l3.041.506c1.342.224,2.315,1.374,2.315,2.733,0,1.654-1.346,3-3,3Z',
  ],
  Wallet: [
    'm23.949,18.293l-1.284-9c-.35-2.447-2.478-4.293-4.95-4.293h-2.566c.219-.456.351-.961.351-1.5,0-1.93-1.57-3.5-3.5-3.5s-3.5,1.57-3.5,3.5c0,.539.133,1.044.351,1.5h-2.491c-2.493,0-4.572,1.789-4.944,4.254L.057,18.254c-.218,1.441.202,2.901,1.153,4.007.951,1.105,2.333,1.739,3.791,1.739h13.998c1.45,0,2.827-.628,3.777-1.724.95-1.095,1.377-2.547,1.173-3.983ZM12,2c.827,0,1.5.673,1.5,1.5s-.673,1.5-1.5,1.5-1.5-.673-1.5-1.5.673-1.5,1.5-1.5Zm1,18v1c0,.553-.448,1-1,1s-1-.447-1-1v-1h-.268c-1.067,0-2.063-.574-2.598-1.499-.276-.479-.113-1.09.365-1.366.477-.278,1.089-.114,1.366.364.179.31.511.501.867.501h2.268c.552,0,1-.448,1-1,0-.379-.271-.698-.645-.761l-3.04-.506c-1.342-.224-2.315-1.374-2.315-2.733,0-1.654,1.346-3,3-3v-1c0-.553.448-1,1-1s1,.447,1,1v1h.268c1.067,0,2.063.574,2.598,1.499.277.479.113,1.09-.364,1.366-.48.278-1.092.112-1.366-.364-.179-.31-.511-.501-.867-.501h-2.268c-.551,0-1,.448-1,1,0,.379.271.698.644.761l3.041.506c1.342.224,2.315,1.374,2.315,2.733,0,1.654-1.346,3-3,3Z',
  ],
  Coins: [
    'm23.949,18.293l-1.284-9c-.35-2.447-2.478-4.293-4.95-4.293h-2.566c.219-.456.351-.961.351-1.5,0-1.93-1.57-3.5-3.5-3.5s-3.5,1.57-3.5,3.5c0,.539.133,1.044.351,1.5h-2.491c-2.493,0-4.572,1.789-4.944,4.254L.057,18.254c-.218,1.441.202,2.901,1.153,4.007.951,1.105,2.333,1.739,3.791,1.739h13.998c1.45,0,2.827-.628,3.777-1.724.95-1.095,1.377-2.547,1.173-3.983ZM12,2c.827,0,1.5.673,1.5,1.5s-.673,1.5-1.5,1.5-1.5-.673-1.5-1.5.673-1.5,1.5-1.5Zm1,18v1c0,.553-.448,1-1,1s-1-.447-1-1v-1h-.268c-1.067,0-2.063-.574-2.598-1.499-.276-.479-.113-1.09.365-1.366.477-.278,1.089-.114,1.366.364.179.31.511.501.867.501h2.268c.552,0,1-.448,1-1,0-.379-.271-.698-.645-.761l-3.04-.506c-1.342-.224-2.315-1.374-2.315-2.733,0-1.654,1.346-3,3-3v-1c0-.553.448-1,1-1s1,.447,1,1v1h.268c1.067,0,2.063.574,2.598,1.499.277.479.113,1.09-.364,1.366-.48.278-1.092.112-1.366-.364-.179-.31-.511-.501-.867-.501h-2.268c-.551,0-1,.448-1,1,0,.379.271.698.644.761l3.041.506c1.342.224,2.315,1.374,2.315,2.733,0,1.654-1.346,3-3,3Z',
  ],
  Home: [
    'M19,24H5c-2.757,0-5-2.243-5-5V9.724c0-1.665,.824-3.215,2.204-4.145L9.203,.855c1.699-1.146,3.895-1.146,5.594,0l7,4.724c1.379,.93,2.203,2.479,2.203,4.145v9.276c0,2.757-2.243,5-5,5Z',
  ],
  House: [
    'M19,24H5c-2.757,0-5-2.243-5-5V9.724c0-1.665,.824-3.215,2.204-4.145L9.203,.855c1.699-1.146,3.895-1.146,5.594,0l7,4.724c1.379,.93,2.203,2.479,2.203,4.145v9.276c0,2.757-2.243,5-5,5Z',
  ],
};

// Centralized mapping — Material Symbols fallback
// Every symbol chosen for maximum fill, minimum internal lines
export const ICON_MAP: Record<string, string> = {
  // Navigation & Layout
  LayoutDashboard: 'space_dashboard',
  Menu: 'menu',
  X: 'close',
  ChevronRight: 'chevron_right',
  ChevronDown: 'expand_more',
  ChevronUp: 'expand_less',
  ChevronLeft: 'chevron_left',
  ArrowLeft: 'arrow_back',
  ArrowRight: 'arrow_forward',
  ArrowUpRight: 'north_east',
  ExternalLink: 'open_in_new',
  Home: 'home',
  MoreHorizontal: 'more_horiz',
  MoreVertical: 'more_vert',
  LayoutList: 'view_agenda',
  LayoutGrid: 'grid_view',

  // Actions
  Plus: 'add',
  Minus: 'remove',
  Pencil: 'edit',
  Trash2: 'delete',
  Save: 'save',
  Copy: 'content_copy',
  Search: 'search',
  Filter: 'filter_list',
  Sort: 'swap_vert',
  RefreshCw: 'sync',
  Download: 'download',
  Upload: 'upload',
  Send: 'send',
  Link2: 'link',
  Archive: 'archive',

  // Status & Feedback
  Check: 'check',
  CheckCircle2: 'check_circle',
  AlertTriangle: 'warning',
  AlertCircle: 'error',
  XCircle: 'cancel',
  Info: 'info',
  Eye: 'visibility',
  EyeOff: 'visibility_off',

  // Business & Finance
  DollarSign: 'payments',
  Wallet: 'wallet',
  Landmark: 'account_balance',
  CreditCard: 'credit_card',
  Receipt: 'receipt',
  ArrowUpCircle: 'arrow_circle_up',
  ArrowDownCircle: 'arrow_circle_down',
  ArrowLeftRight: 'swap_horiz',
  ArrowRightLeft: 'swap_horiz',
  TrendingUp: 'trending_up',
  TrendingDown: 'trending_down',
  PieChart: 'pie_chart',
  Percent: 'percent',
  Coins: 'toll',
  ShoppingCart: 'shopping_cart',
  ShoppingBag: 'shopping_bag',
  ShoppingBasket: 'shopping_basket',

  // People & Communication
  User: 'person',
  UserPlus: 'person_add',
  Users: 'group',
  UserSearch: 'person_search',
  UserCheck: 'how_to_reg',
  MessageCircle: 'chat_bubble',
  MessageSquare: 'forum',
  Mail: 'mail',
  Bell: 'notifications',
  BellRing: 'notifications_active',
  Phone: 'call',
  Send2: 'send',

  // Organization
  Package: 'inventory_2',
  PackageX: 'inventory',
  PackageCheck: 'inventory',
  ClipboardCheck: 'task_alt',
  ClipboardList: 'checklist',
  Folder: 'folder',
  FileText: 'description',
  StickyNote: 'sticky_note_2',
  ListChecks: 'checklist',

  // Settings & System
  Settings: 'settings',
  Settings2: 'tune',
  Shield: 'shield',
  Lock: 'lock',
  LogOut: 'logout',
  Building2: 'apartment',
  Monitor: 'monitor',
  Globe: 'public',
  Hash: 'tag',
  Scale: 'balance',

  // Content & Media
  Image: 'image',
  Camera: 'photo_camera',
  BookOpen: 'auto_stories',
  Lightbulb: 'lightbulb',
  Sparkles: 'auto_awesome',
  Brain: 'psychology',

  // Time & Calendar
  CalendarDays: 'calendar_month',
  Calendar: 'calendar_today',
  Clock: 'schedule',
  History: 'history',

  // Food & Industry
  ChefHat: 'restaurant',
  Utensils: 'restaurant',
  Soup: 'ramen_dining',
  UtensilsCrossed: 'restaurant',

  // Rewards & Achievements
  Gift: 'redeem',
  Star: 'star',
  Trophy: 'emoji_events',
  Crown: 'diamond',
  Gem: 'diamond',
  Medal: 'military_tech',
  Award: 'workspace_premium',
  PartyPopper: 'celebration',
  FlaskConical: 'science',
  Calculator: 'calculate',

  // Misc
  Sun: 'light_mode',
  Moon: 'dark_mode',
  QrCode: 'qr_code_2',
  Megaphone: 'campaign',
  Target: 'my_location',
  Grip: 'drag_indicator',
  GripVertical: 'drag_indicator',

  // Transport & Vehicles
  Car: 'directions_car',
  Truck: 'local_shipping',
  Bus: 'directions_bus',
  Fuel: 'local_gas_station',
  Plane: 'flight',

  // Finance categories
  Banknote: 'payments',
  BadgeDollarSign: 'paid',
  PiggyBank: 'savings',
  HandCoins: 'toll',
  CircleDollarSign: 'monetization_on',
  BarChart3: 'bar_chart',
  BarChart: 'bar_chart',
  LineChart: 'show_chart',
  Activity: 'monitoring',
  Repeat: 'repeat',
  FileSignature: 'contract_edit',

  // Building & Places
  Briefcase: 'work',
  Building: 'business',
  Store: 'storefront',
  Hospital: 'local_hospital',
  GraduationCap: 'school',

  // Home & Living
  House: 'home',
  Sofa: 'weekend',
  Droplets: 'water_drop',
  Zap: 'bolt',
  Wifi: 'wifi',
  Wrench: 'build',
  Hammer: 'handyman',
  Paintbrush: 'brush',
  Scissors: 'content_cut',

  // Health & Body
  Heart: 'favorite',
  HeartPulse: 'monitor_heart',
  Pill: 'medication',
  Stethoscope: 'stethoscope',
  Dumbbell: 'fitness_center',

  // Entertainment
  Music: 'music_note',
  Film: 'movie',
  Gamepad2: 'sports_esports',
  Dices: 'casino',
  Ticket: 'confirmation_number',
  Coffee: 'coffee',
  Wine: 'wine_bar',
  Beer: 'sports_bar',
  Pizza: 'local_pizza',
  Apple: 'nutrition',

  // Tech
  Smartphone: 'smartphone',
  Shirt: 'checkroom',
  Flame: 'local_fire_department',
  Laptop: 'laptop',
  Tv: 'tv',
  Headphones: 'headphones',
  Printer: 'print',

  // Nature
  TreePine: 'park',
  Flower2: 'local_florist',
  Dog: 'pets',
  Cat: 'pets',
  Leaf: 'eco',

  // Documents
  FileCheck: 'task',
  FilePlus: 'note_add',
  Files: 'file_copy',
  Paperclip: 'attach_file',
  Bookmark: 'bookmark',
  Tag: 'label',
  Tags: 'sell',

  // Additional
  Bot: 'smart_toy',
  Vault: 'lock',
  CircleAlert: 'error',
  CalendarRange: 'date_range',
  CalendarIcon2: 'calendar_today',
  Bath: 'bathtub',
  WifiOff: 'wifi_off',
  ToggleLeft: 'toggle_off',
  ToggleRight: 'toggle_on',
  Edit2: 'edit',
  PenLine: 'edit_note',
  FileImage: 'image',
  ImageIcon: 'image',
  Play: 'play_arrow',
  Pause: 'pause',
  Power: 'power_settings_new',
  Loader2: 'progress_activity',
  Delete: 'backspace',
};
