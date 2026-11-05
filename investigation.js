// Estado compartilhado da investigação. app.js persiste este objeto no save.
(() => {
    const clueCatalog = {
        tracks: { title: "Pegadas gigantescas", scene: 6, detail: "As marcas indicam uma criatura de grande porte e confirmam sua passagem pela clareira." },
        fur: { title: "Pelos encontrados", scene: 6, detail: "Vestígio físico associado à criatura; não revela, sozinho, uma vulnerabilidade." },
        blood: { title: "Sangue na perseguição", scene: 7, detail: "A criatura pode ser ferida. Isso não identifica, por si só, um ponto fraco." },
        field_book: { title: "Livro do acampamento", scene: 8, detail: "O livro registra uma possível vulnerabilidade. É uma hipótese documental a confrontar com as evidências." }
    };
    const itemCatalog = {
        thorn_branch: "Galho espinhoso",
        improvised_grenade: "Explosivo improvisado",
        weapon_and_rope: "Arma, uma munição e cordas"
    };
    const fresh = () => ({ version: 1, clues: [], items: [], strategy: null, outcome: null });
    let state = fresh(), modal;
    function ensureUI() {
        if (document.getElementById("investigation-modal")) { modal = document.getElementById("investigation-modal"); return; }
        modal = document.createElement("div"); modal.id = "investigation-modal"; modal.className = "modal";
        modal.innerHTML = '<div class="modal-content"><div class="modal-header"><h3>CADERNO DE INVESTIGAÇÃO</h3><button class="close-btn" type="button" aria-label="Fechar">×</button></div><div class="modal-body" id="investigation-content"></div></div>';
        document.getElementById("game-container")?.appendChild(modal);
        modal.querySelector(".close-btn").addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("active"); });
        document.getElementById("btn-investigation")?.addEventListener("click", () => { render(); modal.classList.add("active"); });
    }
    function render() {
        ensureUI(); const root=document.getElementById("investigation-content"); if(!root)return; root.replaceChildren();
        const addSection=(title,entries,empty)=>{const section=document.createElement("section");section.className="investigation-section";const heading=document.createElement("h4");heading.textContent=title;section.appendChild(heading);if(!entries.length){const p=document.createElement("p");p.className="investigation-empty";p.textContent=empty;section.appendChild(p);}else{const ul=document.createElement("ul");entries.forEach(text=>{const li=document.createElement("li");li.textContent=text;ul.appendChild(li);});section.appendChild(ul);}root.appendChild(section);};
        addSection("Evidências",state.clues.map(id=>{const x=clueCatalog[id];return x?x.title+" — Cena "+x.scene+": "+x.detail:id;}),"Nenhuma evidência registrada.");
        addSection("Hipóteses",["A criatura pode ser ferida: sustentada pelo sangue encontrado na perseguição.","Os espinhos provocaram uma reação observável, mas ainda não provam uma fraqueza decisiva.","O livro apresenta uma possível vulnerabilidade; compare o relato com os vestígios físicos."],"As hipóteses serão atualizadas durante a investigação.");
        addSection("Recursos",state.items.map(id=>itemCatalog[id]||id),"Nenhum recurso especial registrado.");
        const p=document.createElement("p");p.textContent="Estratégia escolhida: "+(state.strategy===null?"ainda não escolhida":["Espinhos + explosivo","Arma + munição limitada","Cordas para contenção e fuga"][state.strategy]);root.appendChild(p);
    }
    function addClue(id){if(!clueCatalog[id]||state.clues.includes(id))return;state.clues.push(id);render();window.saveGame?.();}
    function addItem(id){if(!itemCatalog[id]||state.items.includes(id))return;state.items.push(id);render();window.saveGame?.();}
    function chooseStrategy(i){if(![0,1,2].includes(i))return;state.strategy=i;state.outcome=null;window.saveGame?.();}
    function resolve(){if(state.outcome)return state.outcome;const has=id=>state.items.includes(id),clue=id=>state.clues.includes(id);if(state.strategy===0)state.outcome=has("thorn_branch")&&has("improvised_grenade")?"victory":"defeat";else if(state.strategy===1)state.outcome=has("weapon_and_rope")&&clue("blood")&&clue("field_book")?"victory":"defeat";else if(state.strategy===2)state.outcome=has("weapon_and_rope")&&(clue("tracks")||clue("blood"))?"escape":"defeat";else state.outcome="defeat";window.saveGame?.();return state.outcome;}
    function getState(){return JSON.parse(JSON.stringify(state));}
    // Validação estrita: retorna false se o estado contiver qualquer valor desconhecido.
    const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
    function isValidState(s){
        if(!s||typeof s!=="object"||s.version!==1)return false;
        if(!Array.isArray(s.clues)||!s.clues.every(x=>hasOwn(clueCatalog,x)))return false;
        if(!Array.isArray(s.items)||!s.items.every(x=>hasOwn(itemCatalog,x)))return false;
        if(!(s.strategy==null||[0,1,2].includes(s.strategy)))return false;
        if(!(s.outcome==null||["victory","escape","defeat"].includes(s.outcome)))return false;
        return true;
    }
    function restore(s){state=s&&s.version===1?{version:1,clues:Array.isArray(s.clues)?s.clues.filter(x=>clueCatalog[x]):[],items:Array.isArray(s.items)?s.items.filter(x=>itemCatalog[x]):[],strategy:[0,1,2].includes(s.strategy)?s.strategy:null,outcome:["victory","escape","defeat"].includes(s.outcome)?s.outcome:null}:fresh();}
    function reset(){state=fresh();render();}
    window.Investigation={addClue,addItem,chooseStrategy,resolve,getState,restore,reset,isValidState};
    window.addEventListener("DOMContentLoaded",ensureUI);window.addEventListener("load",ensureUI);
})();