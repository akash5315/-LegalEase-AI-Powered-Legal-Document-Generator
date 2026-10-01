document.addEventListener("DOMContentLoaded", function () {

    console.log("LegalEase JavaScript loaded successfully.");


    // ==========================================
    // GET ELEMENTS
    // ==========================================

    const form = document.getElementById("documentForm");

    const documentType =
        document.getElementById("document_type");

    const employmentFields =
        document.getElementById("employmentFields");

    const ndaFields =
        document.getElementById("ndaFields");

    const leaseFields =
        document.getElementById("leaseFields");

    const generateBtn =
        document.getElementById("generateBtn");

    const preview =
        document.getElementById("preview");

    const status =
        document.getElementById("status");

    const termsBody =
        document.getElementById("termsBody");

    const notice =
        document.getElementById("notice");

    const exportButtons =
        document.querySelectorAll(".export-btn");


    // ==========================================
    // CHECK FORM
    // ==========================================

    if (!form) {

        console.error(
            "ERROR: documentForm was not found."
        );

        return;
    }


    // ==========================================
    // DOCUMENT TYPE FIELDS
    // ==========================================

    function updateFields() {

        const type = documentType.value;


        // Hide everything first

        employmentFields.classList.add("hidden");

        ndaFields.classList.add("hidden");

        leaseFields.classList.add("hidden");


        // Employment

        if (type === "employment") {

            employmentFields.classList.remove("hidden");

        }


        // NDA

        else if (type === "nda") {

            ndaFields.classList.remove("hidden");

        }


        // Lease

        else if (type === "lease") {

            leaseFields.classList.remove("hidden");

        }

    }


    if (documentType) {

        documentType.addEventListener(
            "change",
            updateFields
        );

        updateFields();

    }



    // ==========================================
    // GENERATE DOCUMENT
    // ==========================================

    form.addEventListener(
        "submit",
        async function (event) {

            // VERY IMPORTANT
            // Prevent normal browser GET request

            event.preventDefault();


            console.log(
                "Generate button clicked."
            );


            // Clear previous status

            status.textContent = "";

            status.className = "status";


            // Disable button

            generateBtn.disabled = true;

            generateBtn.textContent =
                "⏳ Generating Document...";


            try {

                // ==================================
                // COLLECT FORM DATA
                // ==================================

                const formData =
                    new FormData(form);


                console.log(
                    "Sending POST request to /api/generate"
                );


                // ==================================
                // SEND TO FASTAPI
                // ==================================

                const response =
                    await fetch(
                        "/api/generate",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                // ==================================
                // READ RESPONSE
                // ==================================

                let data;


                try {

                    data =
                        await response.json();

                }

                catch (jsonError) {

                    throw new Error(
                        "Server returned an invalid response."
                    );

                }


                console.log(
                    "Server response:",
                    data
                );


                // ==================================
                // CHECK ERROR
                // ==================================

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Document generation failed."
                    );

                }


                if (data.error) {

                    throw new Error(
                        data.error
                    );

                }


                // ==================================
                // DISPLAY DOCUMENT
                // ==================================

                preview.value =
                    data.content || "";


                // ==================================
                // DISPLAY TERMS
                // ==================================

                displayTerms(
                    data.terms || []
                );


                // ==================================
                // ENABLE EXPORT BUTTONS
                // ==================================

                exportButtons.forEach(
                    function (button) {

                        button.disabled = false;

                    }
                );


                // ==================================
                // UPDATE NOTICE
                // ==================================

                notice.textContent =
                    "Document generated successfully. You can edit the preview and export it.";


                // ==================================
                // SUCCESS STATUS
                // ==================================

                status.textContent =
                    "✅ Document generated successfully.";

                status.className =
                    "status success";


                console.log(
                    "Document generated successfully."
                );

            }


            catch (error) {

                console.error(
                    "Generation error:",
                    error
                );


                status.textContent =
                    "❌ " + error.message;

                status.className =
                    "status error";


                alert(
                    "Document generation failed.\n\n" +
                    error.message
                );

            }


            finally {

                // Enable button again

                generateBtn.disabled = false;

                generateBtn.textContent =
                    "✨ Generate Document";

            }

        }
    );



    // ==========================================
    // DISPLAY TERMS
    // ==========================================

    function displayTerms(terms) {

        termsBody.innerHTML = "";


        if (!Array.isArray(terms) ||
            terms.length === 0) {

            const row =
                document.createElement("tr");


            const cell =
                document.createElement("td");

            cell.colSpan = 2;

            cell.textContent =
                "No automatic terms detected.";


            row.appendChild(cell);

            termsBody.appendChild(row);

            return;
        }


        terms.forEach(
            function (term) {

                const row =
                    document.createElement("tr");


                const termCell =
                    document.createElement("td");


                const valueCell =
                    document.createElement("td");


                // Support objects such as:
                // {term: "...", value: "..."}

                if (
                    typeof term === "object" &&
                    term !== null
                ) {

                    termCell.textContent =
                        term.term ||
                        term.name ||
                        "";

                    valueCell.textContent =
                        term.value ||
                        "";

                }

                else {

                    termCell.textContent =
                        String(term);

                    valueCell.textContent =
                        "";

                }


                row.appendChild(termCell);

                row.appendChild(valueCell);

                termsBody.appendChild(row);

            }
        );

    }



    // ==========================================
    // EXPORT DOCUMENT
    // ==========================================

    exportButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const format =
                        button.dataset.format;

                    exportDocument(format);

                }
            );

        }
    );



    async function exportDocument(format) {

        // Check content

        if (!preview.value.trim()) {

            alert(
                "Please generate a document first."
            );

            return;
        }


        try {

            console.log(
                "Exporting:",
                format
            );


            // ==================================
            // CREATE FORM DATA
            // ==================================

            const exportData =
                new FormData();


            exportData.append(
                "content",
                preview.value
            );


            exportData.append(
                "terms_json",
                JSON.stringify(
                    getCurrentTerms()
                )
            );


            const companyName =
                document.querySelector(
                    '[name="company_name"]'
                );


            exportData.append(
                "company_name",
                companyName
                    ? companyName.value
                    : ""
            );


            exportData.append(
                "fmt",
                format
            );


            exportData.append(
                "filename_stem",
                "LegalEase_Document"
            );


            // ==================================
            // SEND EXPORT REQUEST
            // ==================================

            const response =
                await fetch(
                    "/api/export",
                    {
                        method: "POST",
                        body: exportData
                    }
                );


            if (!response.ok) {

                let errorText =
                    "Export failed.";

                try {

                    const errorData =
                        await response.json();

                    errorText =
                        errorData.error ||
                        errorText;

                }

                catch (_) {
                    // Ignore JSON parsing error
                }


                throw new Error(
                    errorText
                );

            }


            // ==================================
            // DOWNLOAD FILE
            // ==================================

            const blob =
                await response.blob();


            const url =
                window.URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement("a");


            link.href = url;


            const extension =
                format === "docx"
                    ? "docx"
                    : format;


            link.download =
                `LegalEase_Document.${extension}`;


            document.body.appendChild(link);


            link.click();


            link.remove();


            window.URL.revokeObjectURL(
                url
            );


            console.log(
                "Export successful."
            );

        }


        catch (error) {

            console.error(
                "Export error:",
                error
            );


            alert(
                "Export failed.\n\n" +
                error.message
            );

        }

    }



    // ==========================================
    // GET CURRENT TERMS
    // ==========================================

    function getCurrentTerms() {

        const rows =
            termsBody.querySelectorAll("tr");


        const terms = [];


        rows.forEach(
            function (row) {

                const cells =
                    row.querySelectorAll("td");


                if (cells.length >= 2) {

                    terms.push({

                        term:
                            cells[0].textContent.trim(),

                        value:
                            cells[1].textContent.trim()

                    });

                }

            }
        );


        return terms;

    }



    // ==========================================
    // BACKWARD COMPATIBILITY
    // ==========================================

    // If your HTML or another script calls:
    // exportDoc("pdf")
    //
    // this will still work.

    window.exportDoc =
        function (format) {

            exportDocument(format);

        };


});