// ==UserScript==
// @name         Protem Gallery ZIP Download
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Downloads all pics of the gallery with just one click into a .zip folder and renames the files after gallery name and number
// @match        https://protem.site/gallery/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/USERNAME/REPO/main/websites/youtube/scripts/deinScript.user.js
// @homepageURL  https://github.com/GoonersDev/Tampermonkey/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=protem.site
// @license      CC BY-NC-SA 4.0
// @author       GoonersDev
// ==/UserScript==

(function() {
    'use strict';

    const buttonText = 'Gallery Download'; // Name of the button
    const rowHeight = '24px'; // Exact height of the line

    // ---------------------------
    // Progress Overlay
    // ---------------------------
    let progressOverlay;
    function createProgressOverlay(total) {
        if (!progressOverlay) {
            progressOverlay = document.createElement('div');
            progressOverlay.id = 'zip-progress-overlay';
            progressOverlay.style.position = 'fixed';
            progressOverlay.style.top = '10px';
            progressOverlay.style.left = '50%';
            progressOverlay.style.transform = 'translateX(-50%)';
            progressOverlay.style.padding = '10px 20px';
            progressOverlay.style.background = 'rgba(0,0,0,0.8)';
            progressOverlay.style.color = '#fff';
            progressOverlay.style.borderRadius = '6px';
            progressOverlay.style.zIndex = '99999';
            progressOverlay.style.fontFamily = 'sans-serif';
            document.body.appendChild(progressOverlay);
        }
        progressOverlay.textContent = `Download: 0 / ${total}`;
    }

    function updateProgress(count, total) {
        if (progressOverlay) progressOverlay.textContent = `Download: ${count} / ${total}`;
    }

    function finishProgress() {
        if (progressOverlay) {
            progressOverlay.textContent = 'Download completed!';
            setTimeout(() => progressOverlay.remove(), 2000);
        }
    }

    // -------------------------
    // ZIP-Download Function
    // -------------------------
    async function downloadAllAsZip() {
        const galleryHolder = document.querySelector('.gallery_holder');
        if (!galleryHolder) {
            alert('Galerry not found!');
            return;
        }

        const links = [...galleryHolder.querySelectorAll('a[data-interaction="downloads"]')];
        if (links.length === 0) {
            alert('No download links found!');
            return;
        }

        const galleryTitleEl = document.querySelector('.card-body h2');
        const galleryTitle = galleryTitleEl ? galleryTitleEl.textContent.trim().replace(/[^a-zA-Z0-9_\-]/g, "_") : 'Galerry';

        createProgressOverlay(links.length);

        const zip = new JSZip();

        await Promise.all(links.map(async (a, index) => {
            const url = a.href;
            const numberStr = String(index + 1).padStart(3, '0');
            const extMatch = url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
            const ext = extMatch ? extMatch[0] : '.jpg';
            const filename = `${galleryTitle}_${numberStr}${ext}`;

            try {
                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(filename, blob);
            } catch (e) {
                console.error('Error occurred during download:', url, e);
            }

            updateProgress(index + 1, links.length);
        }));

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${galleryTitle}.zip`;
            link.click();
            finishProgress();
        });
    }

    // -------------------------
    // Button as separate line with <hr> in sidebar
    // -------------------------
    function addButtonRowToSidebar() {
        const sidebar = document.querySelector('.col-lg-4.custom-col');
        if (!sidebar || sidebar.querySelector('#download-zip-row-btn')) return;

        // Container line
        const row = document.createElement('div');
        row.className = 'row mb-2';
        row.style.height = rowHeight;
        row.style.lineHeight = rowHeight; // Text centered vertically

        // Left column: Row name
        const colLeft = document.createElement('div');
        colLeft.className = 'col-6';
        colLeft.style.height = rowHeight;
        colLeft.style.lineHeight = rowHeight;
        colLeft.textContent = 'Download';

        // Right column: Button
        const colRight = document.createElement('div');
        colRight.className = 'col-6 text-end';
        colRight.style.height = rowHeight;
        colRight.style.lineHeight = rowHeight;

        const btn = document.createElement('button');
        btn.id = 'download-zip-row-btn';
        btn.textContent = buttonText;
        btn.style.height = rowHeight;
        btn.style.padding = '0 8px';
        btn.style.background = '#28a745';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';
        btn.onclick = downloadAllAsZip;

        colRight.appendChild(btn);
        row.appendChild(colLeft);
        row.appendChild(colRight);

        // <hr> for visual separation
        const hr = document.createElement('hr');

        const firstStat = sidebar.querySelector('.card.card-body.album_stats_table');
        if (firstStat) {
            firstStat.insertAdjacentElement('afterbegin', hr);
            firstStat.insertAdjacentElement('afterbegin', row);
        } else {
            sidebar.appendChild(row);
            sidebar.appendChild(hr);
        }
    }

    // MutationObserver for dynamic sidebar
    const observer = new MutationObserver(() => addButtonRowToSidebar());
    observer.observe(document.body, { childList: true, subtree: true });

    addButtonRowToSidebar();

})();
