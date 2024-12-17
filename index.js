import fs from "fs"

import { PDFDocument, BlendMode } from "pdf-lib"
import inquirer from "inquirer"

async function split_pdf(pdf_file, output_file){

   const pdf_bytes = fs.readFileSync(pdf_file)
   const doc = await PDFDocument.load(pdf_bytes)

   const page = doc.getPages()[0]

   const { width, height } = page.getSize()

   const new_pdf = await PDFDocument.create()
   const [new_page_dim] = await new_pdf.embedPdf(pdf_bytes);

   const top_page = new_pdf.addPage([width, height/2])
   const bottom_right_page = new_pdf.addPage([width/2, height/2])

   top_page.drawPage(new_page_dim, {
      x: 0,
      y: -height/2,
      width: width,
      height: height,
   })

   bottom_right_page.drawPage(new_page_dim, {
      x: -width/2,
      y: 0,
      width: width,
      height: height,
   })

   const new_pdf_bytes = await new_pdf.save()
   fs.writeFileSync(output_file, new_pdf_bytes)

}

async function show_files_menu(file_to_show) {

   const items = await inquirer.prompt([
      {
         type: "list",
         name: "selected_file",
         message: "Archivo para dividir",
         choices: file_to_show
      }
   ])

   return items.selected_file

}

function ensure_config(){
   if(!fs.existsSync("config.json")){
      console.log("Creando configuración nueva en: config.json")
      fs.writeFileSync("config.json", JSON.stringify({output_file: "output.pdf"}))
   }
}

ensure_config()

var config = {output_file: "output.pdf"} 

try{
   config = await Bun.file("config.json").json()
} catch (err) {
   console.error("Error al cargar la configuración (config.json). Elimínela")
   process.exit(0)
}

const file_to_split = await show_files_menu(fs.readdirSync(".").filter(file => file.toLocaleLowerCase().endsWith("pdf")))

await split_pdf(file_to_split, config.output_file)

console.log("Resultado en:", config.output_file)
process.exit(0)



//split_pdf("sample.pdf")
