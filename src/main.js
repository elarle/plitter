import fs from "fs"

import { PDFDocument } from "pdf-lib"
import inquirer from "inquirer"

const DEFAULT_CONFIG = {output_file: "output.pdf", primera: {x: 0, y: 0}, segunda: {x: 0, y: 0}}

var config = DEFAULT_CONFIG

/**
 * Splits a pdf in two halves
 * @description
 * 
 * The splitting scheme
 * _________
 * |*******|
 * |*******|
 * |-------|
 * |   |***|
 * |   |***|
 * ---------
 * 
 * @param {string} pdf_file 
 * The input pdf filename/path
 * @param {string} output_file
 * The output pdf filename/path
 */
async function split_pdf(pdf_file, output_file){

   //Load pdf
   const pdf_bytes = fs.readFileSync(pdf_file)
   const doc = await PDFDocument.load(pdf_bytes)

   //Extract the page with its dimensions
   const page = doc.getPages()[0]
   const { width, height } = page.getSize()

   //Create the new doc
   const new_pdf = await PDFDocument.create()
   const [new_page_dim] = await new_pdf.embedPdf(pdf_bytes);

   //Create new resized pages
   const top_page = new_pdf.addPage([width, height/2])
   const bottom_right_page = new_pdf.addPage([width/2, height/2])

   //Embed the first part
   top_page.drawPage(new_page_dim, {
      x: 0 + config.primera.x,
      y: -height/2 + config.primera.y,
      width: width,
      height: height,
   })

   //Embed the second part
   bottom_right_page.drawPage(new_page_dim, {
      x: -width/2 + config.segunda.x,
      y: 0 + config.segunda.y,
      width: width,
      height: height,
   })
 
   //Save the new pdf to a different file
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
      fs.writeFileSync("config.json", JSON.stringify(DEFAULT_CONFIG, null, 3))
   }
}

async function main() {

   ensure_config()

   try{

      config = await Bun.file("config.json").json()

      //Check that config has required params
      if(config.primera == undefined){
         console.log("Configuración desactualizada. Migrando a una nueva versión")
         fs.writeFileSync("config.json", JSON.stringify(DEFAULT_CONFIG, null, 3))
         config = DEFAULT_CONFIG;
      }

   } catch (err) {

      console.error("Error al cargar la configuración (config.json). Elimínela")
      await Bun.sleep(3000);
      process.exit(0)

   }

   const file_to_split = await show_files_menu(fs.readdirSync(".").filter(file => file.toLocaleLowerCase().endsWith("pdf")))

   await split_pdf(file_to_split, config.output_file)

   console.log("Resultado en:", config.output_file)

   process.exit(0)
}

main()


//split_pdf("sample.pdf")
