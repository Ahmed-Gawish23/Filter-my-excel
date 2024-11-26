document.addEventListener("DOMContentLoaded", () => {
    $(".select2").select2();

    const distributorColumns = {
        PharmaOverseas: { territory: "Territory Name", product: "Product Name", qty: "Sales" },
        Ibnsina: { territory: "Territory Name", product: "Item Name", qty: "QTY" },
        "ABOU KIR": { territory: "ZONE_NAME", product: "PRODUCT_NAME", qty: "NET_QUANTITY" },
    };

    let sheetData = [];
    let selectedDistributor = "";

    document.getElementById("upload").addEventListener("change", (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const workbook = XLSX.read(event.target.result, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Detect distributor and handle merged rows
            selectedDistributor = detectDistributor(rows);
            const distributorConfig = distributorColumns[selectedDistributor];

            if (!distributorConfig) {
                alert("Distributor type not recognized.");
                return;
            }

            // Extract relevant columns based on the distributor's configuration
            const { territory, product, qty } = distributorConfig;
            const headerRow = rows[0];

            const territoryIndex = headerRow.indexOf(territory);
            const productIndex = headerRow.indexOf(product);
            const qtyIndex = headerRow.indexOf(qty);

            if (territoryIndex === -1 || productIndex === -1 || qtyIndex === -1) {
                alert("Required columns not found. Please check your file.");
                return;
            }

            sheetData = rows.slice(1).map((row) => ({
                territory: row[territoryIndex],
                product: row[productIndex],
                qty: row[qtyIndex],
            }));

            populateDropdowns(sheetData);
        };
        reader.readAsBinaryString(file);
    });

    function detectDistributor(rows) {
        const header = rows[0].join(" ");
        if (header.includes("Territory Name") && header.includes("Product Name")) return "PharmaOverseas";
        if (header.includes("Territory Name") && header.includes("Item Name")) return "Ibnsina";
        if (header.includes("ZONE_NAME")) return "ABOU KIR";
        return "";
    }

    function populateDropdowns(data) {
        const territories = [...new Set(data.map((item) => item.territory))].filter(Boolean).sort();
        const products = [...new Set(data.map((item) => item.product))].filter(Boolean).sort();

        $("#territory").empty().append(territories.map((t) => `<option>${t}</option>`));
        $("#product").empty().append(products.map((p) => `<option>${p}</option>`));
    }

    window.filterData = () => {
        const selectedTerritories = $("#territory").val();
        const selectedProducts = $("#product").val();

        const filtered = sheetData.filter(
            (row) =>
                selectedTerritories.includes(row.territory) &&
                selectedProducts.includes(row.product)
        );

        displayResults(filtered);
    };

    function displayResults(data) {
        const table = document.getElementById("results");
        table.innerHTML = `
            <tr>
                <th>Territory</th>
                <th>Product</th>
                <th>Quantity</th>
            </tr>
        `;
        data.forEach((row) => {
            table.innerHTML += `
                <tr>
                    <td>${row.territory || "N/A"}</td>
                    <td>${row.product || "N/A"}</td>
                    <td>${row.qty || 0}</td>
                </tr>
            `;
        });
    }
});