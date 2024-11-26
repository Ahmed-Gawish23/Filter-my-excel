document.getElementById("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // قراءة ملف Excel
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // معالجة الصفوف المدمجة (تخطي الصف الأول إذا كان عنوان الشيت)
  const validData = jsonData.filter(row => Object.values(row).some(value => value));

  // تحديد نوع الموزع
  let columnMapping = {};
  const columnNames = Object.keys(validData[0]);

  if (columnNames.includes("Product Name") && columnNames.includes("Territory Name") && columnNames.includes("Sales")) {
    columnMapping = { item: "Product Name", territory: "Territory Name", qty: "Sales" }; // PharmaOverseas
  } else if (columnNames.includes("Item Name") && columnNames.includes("Territory Name") && columnNames.includes("QTY")) {
    columnMapping = { item: "Item Name", territory: "Territory Name", qty: "QTY" }; // Ibnsina
  } else if (columnNames.includes("PRODUCT_NAME") && columnNames.includes("ZONE_NAME") && columnNames.includes("NET_QUANTITY")) {
    columnMapping = { item: "PRODUCT_NAME", territory: "ZONE_NAME", qty: "NET_QUANTITY" }; // ABOU KIR
  } else {
    alert("Unknown file format");
    return;
  }

  // استخراج القيم الفريدة وترتيبها أبجديًا
  const items = [...new Set(validData.map(row => row[columnMapping.item]).filter(Boolean))].sort();
  const territories = [...new Set(validData.map(row => row[columnMapping.territory]).filter(Boolean))].sort();

  // القوائم المنسدلة
  const itemSelect = document.getElementById("itemSelect");
  const territorySelect = document.getElementById("territorySelect");

  // تفريغ القوائم قبل ملئها
  itemSelect.innerHTML = "";
  territorySelect.innerHTML = "";

  // ملء قائمة الأدوية
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    itemSelect.appendChild(option);
  });

  // ملء قائمة المناطق
  territories.forEach(territory => {
    const option = document.createElement("option");
    option.value = territory;
    option.textContent = territory;
    territorySelect.appendChild(option);
  });

  // عند الضغط على زر الفلترة
  document.getElementById("filterButton").addEventListener("click", () => {
    const selectedItems = Array.from(itemSelect.selectedOptions).map(option => option.value);
    const selectedTerritories = Array.from(territorySelect.selectedOptions).map(option => option.value);

    // فلترة البيانات بناءً على الاختيارات
    const filteredData = validData.filter(row =>
      selectedItems.includes(row[columnMapping.item]) &&
      selectedTerritories.includes(row[columnMapping.territory])
    );

    // حساب الكميات لكل دواء في كل منطقة
    const result = {};
    filteredData.forEach(row => {
      const key = `${row[columnMapping.item]} - ${row[columnMapping.territory]}`;
      if (!result[key]) result[key] = 0;
      result[key] += row[columnMapping.qty];
    });

    // عرض النتائج
    const output = document.getElementById("output");
    output.innerHTML = "<h3>Filtered Results:</h3>";
    Object.entries(result).forEach(([key, qty]) => {
      const p = document.createElement("p");
      p.textContent = `${key}: ${qty} boxes`;
      output.appendChild(p);
    });
  });
});