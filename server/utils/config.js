import {readFile, writeFile} from 'fs';

export const readJSON = (filename)=>{
    console.log("reading JSON", filename);

    return new Promise((resolve, reject)=>{
        readFile(filename, 'utf8', (err, data) => {
            
            if (err){
                console.log(err);
                reject([]);
            }
            else{
                console.log(data);
                try {
                    resolve(JSON.parse(data));
                }catch(err){
                    resolve([]);
                }
            }
        });
    });
}

export const writeJSON = (filename, obj)=>{
    return new Promise((resolve, reject)=>{
      try{
        const jsonstr = JSON.stringify(obj);

        writeFile(filename, jsonstr, 'utf8', (err) => {
          if (err){
            reject(err);
          }
          else{
            resolve({success:true});
          }
        });
      }catch(err){
        reject(err);
      }
    });
}