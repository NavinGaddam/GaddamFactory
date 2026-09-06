export type Lang = 'en' | 'mr';

export const UI = {
  en: {
    dashboard: 'Dashboard', stock: 'Stock', inward: 'Goods Inward', batches: 'Batches', workers: 'Workers',
    attendance: 'Attendance', payroll: 'Payroll', reports: 'Reports', logbook: 'Logbook', settings: 'Settings',
    logout: 'Sign out', welcome: 'Factory overview', receive: 'Receive Goods', newBatch: 'New Batch',
    totalStock: 'Total Stock', receivedToday: 'Received Today', production: 'Production Today', present: 'Workers Present',
    activeBatches: 'Active Batches', checkIn: 'Check In', checkOut: 'Check Out', break: 'Break', save: 'Save', cancel: 'Cancel',
    owner: 'Owner', manager: 'Manager', employee: 'Worker', watchman: 'Watchman', loginTitle: 'Gaddam Factory',
    loginText: 'Use your Google account to enter the factory system', continueGoogle: 'Continue with Google',
    restricted: 'This Google account has not been assigned access yet.', english: 'English', marathi: 'मराठी',
    light: 'Light', dark: 'Dark', add: 'Add', online: 'Connected', loading: 'Loading…', today: 'Today'
  },
  mr: {
    dashboard: 'डॅशबोर्ड', stock: 'साठा', inward: 'माल आवक', batches: 'बॅच', workers: 'कामगार', attendance: 'हजेरी',
    payroll: 'पगार', reports: 'अहवाल', logbook: 'लॉगबुक', settings: 'सेटिंग', logout: 'बाहेर पडा', welcome: 'फॅक्टरीचा आढावा',
    receive: 'माल नोंदवा', newBatch: 'नवी बॅच', totalStock: 'एकूण साठा', receivedToday: 'आजची आवक', production: 'आजचे उत्पादन',
    present: 'उपस्थित कामगार', activeBatches: 'चालू बॅच', checkIn: 'आत घ्या', checkOut: 'बाहेर करा', break: 'विश्रांती',
    save: 'जतन करा', cancel: 'रद्द', owner: 'मालक', manager: 'मॅनेजर', employee: 'कामगार', watchman: 'वॉचमन',
    loginTitle: 'गड्डाम फॅक्टरी', loginText: 'फॅक्टरीमध्ये प्रवेशासाठी Google खाते वापरा', continueGoogle: 'Google ने सुरू करा',
    restricted: 'या Google खात्याला अजून प्रवेश दिलेला नाही.', english: 'English', marathi: 'मराठी', light: 'लाइट', dark: 'डार्क',
    add: 'जोडा', online: 'कनेक्टेड', loading: 'लोड होत आहे…', today: 'आज'
  }
} as const;
